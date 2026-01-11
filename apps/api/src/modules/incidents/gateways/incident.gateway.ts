import { Logger } from '@nestjs/common';
import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Incident } from '../entities/incident.entity';

/**
 * Interface para dados de criação de incidente no WebSocket
 */
interface IncidentCreatedData {
  id: string;
  incident_type: string;
  severity: string;
  status: string;
  reported_by_user_id: string;
  team_id?: string;
  location_state?: string;
  description: string;
  created_at: Date;
}

/**
 * Interface para dados de mudança de status
 */
interface StatusUpdatedData {
  old_status: string;
  new_status: string;
  changed_by_user_id?: string;
  team_id?: string;
  time_in_previous_status?: number;
  severity?: string;
  incident_type?: string;
}

/**
 * Interface para dados de comentário
 */
interface CommentData {
  id: string;
  comment_text: string;
  user_id?: string | null;
  created_at: Date;
  is_internal: boolean;
}

/**
 * Interface para dados de anexo
 */
interface AttachmentData {
  id: string;
  file_name: string;
  file_size: number;
  file_type: string;
  uploaded_by_user_id?: string | null;
  created_at: Date;
}

/**
 * Interface para dados de eventos WebSocket de incidentes
 */
interface IncidentEventData<T = unknown> {
  incident_id: string;
  event_type: 'created' | 'status_updated' | 'comment_added' | 'attachment_added';
  data: T;
  timestamp: Date;
  user_id?: string;
}

/**
 * Interface para dados de entrada ao entrar em uma sala
 */
interface JoinRoomData {
  room: string;
  team_id?: string;
  region?: string;
}

/**
 * Gateway WebSocket para eventos em tempo real de incidentes
 *
 * Namespace: /incidents
 *
 * Eventos emitidos:
 * - incident:created - Novo incidente criado
 * - incident:status_updated - Status do incidente atualizado
 * - incident:comment_added - Novo comentário adicionado
 * - incident:attachment_added - Novo anexo enviado
 *
 * Eventos recebidos:
 * - joinRoom - Cliente entra em uma sala específica
 * - leaveRoom - Cliente sai de uma sala
 *
 * Rooms disponíveis:
 * - incidents_all - Todos os incidentes
 * - incidents_team_{team_id} - Incidentes de uma equipe específica
 * - incidents_region_{region} - Incidentes de uma região específica
 * - incident_{incident_id} - Atualizações de um incidente específico
 */
@WebSocketGateway({
  namespace: 'incidents',
  cors: {
    origin: '*', // TODO: Configurar origins permitidas via env
    credentials: true,
  },
  transports: ['websocket', 'polling'],
})
export class IncidentGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(IncidentGateway.name);

  /**
   * Executado quando o gateway é inicializado
   */
  afterInit(_server: Server): void {
    this.logger.log('Incident WebSocket Gateway initialized');
    this.logger.log('Listening on namespace: /incidents');
  }

  /**
   * Executado quando um cliente se conecta
   */
  handleConnection(client: Socket): void {
    this.logger.log(`Client connected: ${client.id}`);
    const socketCount = this.server.sockets.sockets.size;
    this.logger.debug(`Total clients connected: ${socketCount}`);
  }

  /**
   * Executado quando um cliente se desconecta
   */
  handleDisconnect(client: Socket): void {
    this.logger.log(`Client disconnected: ${client.id}`);
    const socketCount = this.server.sockets.sockets.size;
    this.logger.debug(`Total clients connected: ${socketCount}`);
  }

  /**
   * Handler para cliente entrar em uma sala específica
   *
   * @example
   * socket.emit('joinRoom', { room: 'all' })
   * socket.emit('joinRoom', { room: 'team', team_id: 'uuid' })
   * socket.emit('joinRoom', { room: 'region', region: 'SP' })
   * socket.emit('joinRoom', { room: 'incident', incident_id: 'uuid' })
   */
  @SubscribeMessage('joinRoom')
  handleJoinRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: JoinRoomData,
  ): { event: string; data: { joined: string; message: string } } {
    const { room, team_id, region } = data;

    let roomName: string;

    switch (room) {
      case 'all':
        roomName = 'incidents_all';
        break;
      case 'team':
        if (!team_id) {
          return {
            event: 'error',
            data: {
              joined: '',
              message: 'team_id is required when joining team room',
            },
          };
        }
        roomName = `incidents_team_${team_id}`;
        break;
      case 'region':
        if (!region) {
          return {
            event: 'error',
            data: {
              joined: '',
              message: 'region is required when joining region room',
            },
          };
        }
        roomName = `incidents_region_${region}`;
        break;
      default:
        // Room personalizada (ex: incident_{id})
        roomName = room.startsWith('incident_') ? room : `incidents_${room}`;
    }

    void client.join(roomName);
    this.logger.log(`Client ${client.id} joined room: ${roomName}`);

    return {
      event: 'roomJoined',
      data: {
        joined: roomName,
        message: `Successfully joined room: ${roomName}`,
      },
    };
  }

  /**
   * Handler para cliente sair de uma sala
   */
  @SubscribeMessage('leaveRoom')
  handleLeaveRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() room: string,
  ): { event: string; data: { left: string; message: string } } {
    void client.leave(room);
    this.logger.log(`Client ${client.id} left room: ${room}`);

    return {
      event: 'roomLeft',
      data: {
        left: room,
        message: `Successfully left room: ${room}`,
      },
    };
  }

  // ============ Métodos para emitir eventos ============

  /**
   * Emite evento quando um novo incidente é criado
   *
   * Salas notificadas:
   * - incidents_all
   * - incidents_team_{team_id} (se aplicável)
   * - incidents_region_{region} (se aplicável)
   */
  emitIncidentCreated(incident: Incident | IncidentCreatedData): void {
    const eventData: IncidentEventData<Incident | IncidentCreatedData> = {
      incident_id: incident.id,
      event_type: 'created',
      data: incident,
      timestamp: new Date(),
      user_id: incident.reported_by_user_id,
    };

    // Enviar para sala geral
    void this.server.to('incidents_all').emit('incident:created', eventData);

    const teamId = 'team_id' in incident ? incident.team_id : undefined;
    const locationState = 'location_state' in incident ? incident.location_state : undefined;

    // Enviar para sala de equipe, se aplicável
    if (teamId) {
      void this.server.to(`incidents_team_${teamId}`).emit('incident:created', eventData);
    }

    // Enviar para sala de região, se aplicável
    if (locationState) {
      void this.server.to(`incidents_region_${locationState}`).emit('incident:created', eventData);
    }

    this.logger.debug(`Emitted incident:created for incident ${incident.id}`);
  }

  /**
   * Emite evento quando o status de um incidente é atualizado
   *
   * Salas notificadas:
   * - incidents_all
   * - incident_{incident_id}
   * - incidents_team_{team_id}
   */
  emitStatusUpdated(
    incidentId: string,
    oldStatus: string,
    newStatus: string,
    metadata?: StatusUpdatedData,
  ): void {
    const statusData: StatusUpdatedData = {
      old_status: oldStatus,
      new_status: newStatus,
      ...metadata,
    };

    const eventData: IncidentEventData<StatusUpdatedData> = {
      incident_id: incidentId,
      event_type: 'status_updated',
      data: statusData,
      timestamp: new Date(),
      user_id: metadata?.changed_by_user_id,
    };

    // Enviar para sala geral
    void this.server.to('incidents_all').emit('incident:status_updated', eventData);

    // Enviar para sala do incidente específico
    void this.server.to(`incident_${incidentId}`).emit('incident:status_updated', eventData);

    // Enviar para sala de equipe, se aplicável
    if (metadata?.team_id) {
      void this.server
        .to(`incidents_team_${metadata.team_id}`)
        .emit('incident:status_updated', eventData);
    }

    this.logger.debug(
      `Emitted incident:status_updated for incident ${incidentId}: ${oldStatus} -> ${newStatus}`,
    );
  }

  /**
   * Emite evento quando um comentário é adicionado a um incidente
   *
   * Salas notificadas:
   * - incidents_all
   * - incident_{incident_id}
   */
  emitCommentAdded(incidentId: string, comment: CommentData): void {
    const eventData: IncidentEventData<CommentData> = {
      incident_id: incidentId,
      event_type: 'comment_added',
      data: comment,
      timestamp: new Date(),
      user_id: comment.user_id ?? undefined,
    };

    // Enviar para sala geral
    void this.server.to('incidents_all').emit('incident:comment_added', eventData);

    // Enviar para sala do incidente específico
    void this.server.to(`incident_${incidentId}`).emit('incident:comment_added', eventData);

    this.logger.debug(`Emitted incident:comment_added for incident ${incidentId}`);
  }

  /**
   * Emite evento quando um anexo é adicionado a um incidente
   *
   * Salas notificadas:
   * - incidents_all
   * - incident_{incident_id}
   */
  emitAttachmentAdded(incidentId: string, attachment: AttachmentData): void {
    const eventData: IncidentEventData<AttachmentData> = {
      incident_id: incidentId,
      event_type: 'attachment_added',
      data: attachment,
      timestamp: new Date(),
      user_id: attachment.uploaded_by_user_id ?? undefined,
    };

    // Enviar para sala geral
    void this.server.to('incidents_all').emit('incident:attachment_added', eventData);

    // Enviar para sala do incidente específico
    void this.server.to(`incident_${incidentId}`).emit('incident:attachment_added', eventData);

    this.logger.debug(`Emitted incident:attachment_added for incident ${incidentId}`);
  }

  /**
   * Emite evento genérico para um incidente específico
   *
   * Útil para eventos customizados
   */
  emitToIncident(incidentId: string, event: string, data: unknown): void {
    void this.server.to(`incident_${incidentId}`).emit(event, {
      incident_id: incidentId,
      data,
      timestamp: new Date(),
    });

    this.logger.debug(`Emitted ${event} for incident ${incidentId}`);
  }

  /**
   * Retorna estatísticas de conexões ativas
   */
  getStats(): {
    total_connections: number;
    rooms: string[];
  } {
    const socketIdPattern = /^[a-f0-9-]{36}$/;
    const rooms = Array.from(this.server.sockets.adapter.rooms.keys()).filter(
      (room): room is string => !socketIdPattern.exec(room),
    );

    return {
      total_connections: this.server.sockets.sockets.size,
      rooms,
    };
  }

  /**
   * Emite atualização de métricas em tempo real
   *
   * Sala: metrics
   */
  emitMetricsUpdate(metrics: {
    total_incidents: number;
    active_incidents: number;
    resolved_today: number;
    critical_count: number;
    average_resolution_time?: number;
  }): void {
    void this.server.to('metrics').emit('metrics:snapshot', {
      metrics,
      timestamp: new Date(),
    });

    this.logger.debug('Emitted metrics:snapshot');
  }

  /**
   * Emite alerta de métrica crítica
   *
   * Salas: metrics, incidents_all
   */
  emitMetricsAlert(alert: {
    type: 'high_volume' | 'long_resolution' | 'critical_surge';
    message: string;
    value: number;
    threshold: number;
  }): void {
    const alertData = {
      ...alert,
      timestamp: new Date(),
      severity: 'warning',
    };

    void this.server.to('metrics').emit('metrics:alert', alertData);
    void this.server.to('incidents_all').emit('metrics:alert', alertData);

    this.logger.warn(`Metrics alert: ${alert.type} - ${alert.message}`);
  }
}

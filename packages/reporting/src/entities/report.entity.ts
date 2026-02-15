import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";
import { ReportType } from "../enums/report-type.enum";

@Entity("reports")
export class Report {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "varchar", length: 255 })
  name: string;

  @Column({ type: "text", nullable: true })
  description: string;

  @Column({ type: "enum", enum: ReportType })
  type: ReportType;

  @Column({ type: "varchar", length: 50 })
  format: string;

  @Column({ type: "varchar", length: 500, nullable: true })
  filePath: string;

  @Column({ type: "json", nullable: true })
  parameters: Record<string, unknown>;

  @Column({ type: "int", nullable: true })
  fileSize: number;

  @Column({ type: "varchar", length: 100, nullable: true })
  mimeType: string;

  @Column({ type: "varchar", length: 100, nullable: true })
  generatedBy: string;

  @Column({ type: "timestamp", nullable: true })
  generatedAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

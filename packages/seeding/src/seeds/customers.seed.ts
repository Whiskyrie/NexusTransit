import { Injectable, Logger, Inject } from "@nestjs/common";
import { Repository } from "typeorm";
import { ISeed } from "../interfaces/seed.interface";

/**
 * Enums para Customer
 */
enum CustomerType {
  INDIVIDUAL = "individual",
  CORPORATE = "corporate",
}

enum CustomerStatus {
  ACTIVE = "active",
  INACTIVE = "inactive",
  BLOCKED = "blocked",
  PROSPECT = "prospect",
}

enum CustomerCategory {
  STANDARD = "standard",
  PREMIUM = "premium",
  VIP = "vip",
}

enum AddressType {
  RESIDENTIAL = "residential",
  COMMERCIAL = "commercial",
  BILLING = "billing",
  SHIPPING = "shipping",
  OTHER = "other",
}

/**
 * Interface para Customer Entity no seed
 */
interface CustomerEntity {
  id?: string;
  taxId: string;
  name: string;
  email: string;
  phone: string;
  type: CustomerType;
  status: CustomerStatus;
  category: CustomerCategory;
  metadata?: Record<string, unknown>;
}

/**
 * Interface para CustomerAddress Entity no seed
 */
interface CustomerAddressEntity {
  id?: string;
  customerId: string;
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  zipCode: string;
  city: string;
  state: string;
  latitude?: number;
  longitude?: number;
  type: AddressType;
  isPrimary: boolean;
  isActive: boolean;
}

/**
 * Seed de clientes de exemplo
 *
 * Cria clientes com endereços para desenvolvimento e testes
 * Volume: ~150 clientes com múltiplos endereços
 */
@Injectable()
export class CustomersSeed implements ISeed {
  private readonly logger = new Logger(CustomersSeed.name);

  constructor(
    @Inject("CUSTOMER_REPOSITORY")
    private readonly customerRepository: Repository<CustomerEntity>,
    @Inject("CUSTOMER_ADDRESS_REPOSITORY")
    private readonly customerAddressRepository: Repository<CustomerAddressEntity>,
  ) {}

  async run(): Promise<void> {
    this.logger.log("Iniciando seed de clientes...");

    // Verificar se já existem clientes suficientes
    const count = await this.customerRepository.count();
    if (count >= 150) {
      this.logger.log(`Já existem ${count} clientes no sistema. Pulando seed.`);
      return;
    }

    this.logger.log(`Existem ${count} clientes. Criando mais clientes...`);

    // Calcular quantos clientes ainda precisamos criar
    const targetCount = 150;
    const toCreate = targetCount - count;

    // Usar timestamp para garantir unicidade absoluta
    const timestamp = Date.now();
    let createdCount = 0;

    for (let i = 0; i < toCreate; i++) {
      try {
        const uniqueId = timestamp + i;
        const customerData = this.generateUniqueCustomer(uniqueId, i);

        // Criar cliente
        const customer = this.customerRepository.create(customerData.customer);
        const savedCustomer = await this.customerRepository.save(customer);

        // Criar endereços do cliente
        for (const addressData of customerData.addresses) {
          const address = this.customerAddressRepository.create({
            ...addressData,
            customerId: savedCustomer.id!,
          });
          await this.customerAddressRepository.save(address);
        }

        createdCount++;

        if (createdCount % 20 === 0) {
          this.logger.log(`Progresso: ${createdCount}/${toCreate} clientes criados...`);
        }
      } catch (error) {
        this.logger.error(
          `Erro ao criar cliente: ${error instanceof Error ? error.message : "Erro desconhecido"}`,
        );
      }
    }

    this.logger.log(`Seed de clientes concluído. ${createdCount} clientes criados.`);
  }

  private generateUniqueCustomer(
    uniqueId: number,
    index: number,
  ): {
    customer: Partial<CustomerEntity>;
    addresses: Partial<CustomerAddressEntity>[];
  } {
    const firstNames = [
      "Ana",
      "Bruno",
      "Carlos",
      "Diana",
      "Eduardo",
      "Fernanda",
      "Gabriel",
      "Helena",
      "Igor",
      "Julia",
      "Lucas",
      "Maria",
      "Nicolas",
      "Olivia",
      "Pedro",
      "Rafaela",
      "Samuel",
      "Tatiana",
      "Victor",
      "Yasmin",
    ];
    const lastNames = [
      "Silva",
      "Santos",
      "Oliveira",
      "Souza",
      "Rodrigues",
      "Ferreira",
      "Alves",
      "Pereira",
      "Lima",
      "Gomes",
      "Costa",
      "Ribeiro",
      "Martins",
      "Carvalho",
      "Almeida",
      "Lopes",
      "Soares",
      "Fernandes",
      "Vieira",
      "Barbosa",
    ];
    const cities = [
      { city: "São Paulo", state: "SP", lat: -23.5505, lng: -46.6333 },
      { city: "Rio de Janeiro", state: "RJ", lat: -22.9068, lng: -43.1729 },
      { city: "Belo Horizonte", state: "MG", lat: -19.9167, lng: -43.9345 },
      { city: "Curitiba", state: "PR", lat: -25.4284, lng: -49.2733 },
      { city: "Porto Alegre", state: "RS", lat: -30.0346, lng: -51.2177 },
      { city: "Florianópolis", state: "SC", lat: -27.5954, lng: -48.548 },
      { city: "Salvador", state: "BA", lat: -12.9714, lng: -38.5014 },
      { city: "Brasília", state: "DF", lat: -15.7942, lng: -47.8822 },
      { city: "Fortaleza", state: "CE", lat: -3.7172, lng: -38.5433 },
      { city: "Recife", state: "PE", lat: -8.0476, lng: -34.877 },
    ];

    const firstName = firstNames[index % firstNames.length];
    const lastName = lastNames[Math.floor(index / firstNames.length) % lastNames.length];
    const cityData = cities[index % cities.length];

    // Gerar CPF único usando uniqueId
    const cpf = this.generateUniqueCPF(uniqueId);

    const categories = [CustomerCategory.STANDARD, CustomerCategory.PREMIUM, CustomerCategory.VIP];
    const statuses = [
      CustomerStatus.ACTIVE,
      CustomerStatus.ACTIVE,
      CustomerStatus.ACTIVE,
      CustomerStatus.INACTIVE,
    ];

    return {
      customer: {
        name: `${firstName} ${lastName}`,
        taxId: cpf,
        email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}.${uniqueId}@email.com.br`,
        phone: `(${11 + (index % 80)}) 9${String(uniqueId % 10000).padStart(4, "0")}-${String((index * 17) % 10000).padStart(4, "0")}`,
        type: CustomerType.INDIVIDUAL,
        status: statuses[index % statuses.length],
        category: categories[index % categories.length],
        metadata: {
          preferredDeliveryTime: index % 2 === 0 ? "morning" : "afternoon",
          receivePromotions: index % 3 !== 0,
        },
      },
      addresses: [
        {
          street: `Rua ${firstName} ${lastName}`,
          number: String(100 + index),
          complement: index % 5 === 0 ? `Apto ${100 + index}` : undefined,
          neighborhood: `Bairro ${(index % 10) + 1}`,
          zipCode: `${String(10000000 + index).slice(-8)}`,
          city: cityData.city,
          state: cityData.state,
          latitude: cityData.lat + (index % 100) * 0.001,
          longitude: cityData.lng + (index % 100) * 0.001,
          type: AddressType.RESIDENTIAL,
          isPrimary: true,
          isActive: true,
        },
      ],
    };
  }

  private generateUniqueCPF(seed: number): string {
    // Gerar CPF único baseado no seed (timestamp + index)
    const s = String(seed).padStart(11, "0").slice(-9);
    const n1 = parseInt(s[0]);
    const n2 = parseInt(s[1]);
    const n3 = parseInt(s[2]);
    const n4 = parseInt(s[3]);
    const n5 = parseInt(s[4]);
    const n6 = parseInt(s[5]);
    const n7 = parseInt(s[6]);
    const n8 = parseInt(s[7]);
    const n9 = parseInt(s[8]);

    const d1 = (n1 + n2 + n3 + n4 + n5 + n6 + n7 + n8 + n9) % 10;
    const d2 = (d1 + n1 + n2 + n3 + n4 + n5 + n6 + n7 + n8 + n9) % 10;

    return `${n1}${n2}${n3}.${n4}${n5}${n6}.${n7}${n8}${n9}-${d1}${d2}`;
  }

  private getCustomersData(offset: number = 0): Array<{
    customer: Partial<CustomerEntity>;
    addresses: Partial<CustomerAddressEntity>[];
  }> {
    // Dados realistas de empresas brasileiras
    const corporateCustomers = [
      {
        name: "Tech Solutions Ltda",
        taxId: "12.345.678/0001-90",
        email: "contato@techsolutions.com.br",
        phone: "(11) 3456-7890",
        city: "São Paulo",
        state: "SP",
      },
      {
        name: "Mercado Express S.A.",
        taxId: "23.456.789/0001-01",
        email: "compras@mercadoexpress.com.br",
        phone: "(11) 4567-8901",
        city: "São Paulo",
        state: "SP",
      },
      {
        name: "Farmácia Saúde Total",
        taxId: "34.567.890/0001-12",
        email: "pedidos@farmaciasudetotal.com.br",
        phone: "(21) 3456-7890",
        city: "Rio de Janeiro",
        state: "RJ",
      },
      {
        name: "Indústria Metalúrgica Brasil",
        taxId: "45.678.901/0001-23",
        email: "logistica@metalurgicabrasil.com.br",
        phone: "(31) 3456-7890",
        city: "Belo Horizonte",
        state: "MG",
      },
      {
        name: "Distribuidora Atacadão",
        taxId: "56.789.012/0001-34",
        email: "comercial@atacadao.com.br",
        phone: "(41) 3456-7890",
        city: "Curitiba",
        state: "PR",
      },
      {
        name: "Auto Peças Premium",
        taxId: "67.890.123/0001-45",
        email: "vendas@autopecaspremium.com.br",
        phone: "(51) 3456-7890",
        city: "Porto Alegre",
        state: "RS",
      },
      {
        name: "Eletrônicos Master",
        taxId: "78.901.234/0001-56",
        email: "suporte@eletronicosmaster.com.br",
        phone: "(48) 3456-7890",
        city: "Florianópolis",
        state: "SC",
      },
      {
        name: "Móveis & Decorações",
        taxId: "89.012.345/0001-67",
        email: "vendas@moveisdecoracoes.com.br",
        phone: "(62) 3456-7890",
        city: "Goiânia",
        state: "GO",
      },
      {
        name: "Alimentos Naturais S.A.",
        taxId: "90.123.456/0001-78",
        email: "pedidos@alimentosnaturais.com.br",
        phone: "(71) 3456-7890",
        city: "Salvador",
        state: "BA",
      },
      {
        name: "Cosméticos Beleza Pura",
        taxId: "01.234.567/0001-89",
        email: "vendas@belezapura.com.br",
        phone: "(81) 3456-7890",
        city: "Recife",
        state: "PE",
      },
      {
        name: "Materiais de Construção ABC",
        taxId: "11.222.333/0001-44",
        email: "compras@construcaoabc.com.br",
        phone: "(85) 3456-7890",
        city: "Fortaleza",
        state: "CE",
      },
      {
        name: "Têxtil Nordeste",
        taxId: "22.333.444/0001-55",
        email: "comercial@textilnordeste.com.br",
        phone: "(84) 3456-7890",
        city: "Natal",
        state: "RN",
      },
      {
        name: "Livraria Cultural",
        taxId: "33.444.555/0001-66",
        email: "pedidos@livrariacultural.com.br",
        phone: "(91) 3456-7890",
        city: "Belém",
        state: "PA",
      },
      {
        name: "Equipamentos Hospitalares",
        taxId: "44.555.666/0001-77",
        email: "vendas@equiphospitalares.com.br",
        phone: "(92) 3456-7890",
        city: "Manaus",
        state: "AM",
      },
      {
        name: "Agropecuária Centro-Oeste",
        taxId: "55.666.777/0001-88",
        email: "comercial@agrocentrooeste.com.br",
        phone: "(65) 3456-7890",
        city: "Cuiabá",
        state: "MT",
      },
      {
        name: "Papelaria e Escritório",
        taxId: "66.777.888/0001-99",
        email: "vendas@papelariaeescritorio.com.br",
        phone: "(67) 3456-7890",
        city: "Campo Grande",
        state: "MS",
      },
      {
        name: "Informática Total",
        taxId: "77.888.999/0001-00",
        email: "suporte@informaticatotal.com.br",
        phone: "(27) 3456-7890",
        city: "Vitória",
        state: "ES",
      },
      {
        name: "Calçados Brasil",
        taxId: "88.999.000/0001-11",
        email: "vendas@calcadosbrasil.com.br",
        phone: "(19) 3456-7890",
        city: "Campinas",
        state: "SP",
      },
      {
        name: "Brinquedos Felicidade",
        taxId: "99.000.111/0001-22",
        email: "pedidos@brinquedosfelicidade.com.br",
        phone: "(16) 3456-7890",
        city: "Ribeirão Preto",
        state: "SP",
      },
      {
        name: "Bebidas Premium",
        taxId: "00.111.222/0001-33",
        email: "comercial@bebidaspremium.com.br",
        phone: "(15) 3456-7890",
        city: "Sorocaba",
        state: "SP",
      },
    ];

    // Nomes e sobrenomes para clientes individuais
    const firstNames = [
      "João",
      "Maria",
      "Pedro",
      "Ana",
      "Carlos",
      "Juliana",
      "Fernando",
      "Patricia",
      "Ricardo",
      "Camila",
      "Lucas",
      "Amanda",
      "Marcos",
      "Fernanda",
      "Rafael",
      "Beatriz",
      "Gabriel",
      "Larissa",
      "Thiago",
      "Natália",
      "Bruno",
      "Carolina",
      "Diego",
      "Vanessa",
      "Gustavo",
      "Isabela",
      "Leandro",
      "Mariana",
      "André",
      "Renata",
      "Felipe",
      "Aline",
      "Rodrigo",
      "Priscila",
      "Eduardo",
      "Letícia",
      "Marcelo",
      "Bruna",
      "Leonardo",
      "Daniela",
    ];

    const lastNames = [
      "Silva",
      "Santos",
      "Oliveira",
      "Souza",
      "Rodrigues",
      "Ferreira",
      "Almeida",
      "Pereira",
      "Lima",
      "Gomes",
      "Costa",
      "Ribeiro",
      "Martins",
      "Carvalho",
      "Araújo",
      "Fernandes",
      "Melo",
      "Barbosa",
      "Rocha",
      "Nascimento",
    ];

    // Endereços brasileiros realistas
    const addresses = [
      {
        street: "Av. Paulista",
        neighborhood: "Bela Vista",
        city: "São Paulo",
        state: "SP",
        zip: "01310100",
        lat: -23.5614,
        lng: -46.6565,
      },
      {
        street: "Rua Augusta",
        neighborhood: "Consolação",
        city: "São Paulo",
        state: "SP",
        zip: "01305000",
        lat: -23.5537,
        lng: -46.6593,
      },
      {
        street: "Av. Brasil",
        neighborhood: "Centro",
        city: "Rio de Janeiro",
        state: "RJ",
        zip: "20040020",
        lat: -22.8963,
        lng: -43.2178,
      },
      {
        street: "Rua XV de Novembro",
        neighborhood: "Centro",
        city: "Curitiba",
        state: "PR",
        zip: "80020310",
        lat: -25.4296,
        lng: -49.2714,
      },
      {
        street: "Av. Afonso Pena",
        neighborhood: "Centro",
        city: "Belo Horizonte",
        state: "MG",
        zip: "30130000",
        lat: -19.9191,
        lng: -43.9386,
      },
      {
        street: "Rua dos Andradas",
        neighborhood: "Centro Histórico",
        city: "Porto Alegre",
        state: "RS",
        zip: "90020000",
        lat: -30.0322,
        lng: -51.2302,
      },
      {
        street: "Av. Beira Mar",
        neighborhood: "Centro",
        city: "Florianópolis",
        state: "SC",
        zip: "88015300",
        lat: -27.5949,
        lng: -48.5482,
      },
      {
        street: "Rua 85",
        neighborhood: "Setor Marista",
        city: "Goiânia",
        state: "GO",
        zip: "74160010",
        lat: -16.6869,
        lng: -49.2648,
      },
      {
        street: "Av. Sete de Setembro",
        neighborhood: "Barra",
        city: "Salvador",
        state: "BA",
        zip: "40140000",
        lat: -13.0114,
        lng: -38.5341,
      },
      {
        street: "Av. Boa Viagem",
        neighborhood: "Boa Viagem",
        city: "Recife",
        state: "PE",
        zip: "51020000",
        lat: -8.1194,
        lng: -34.8927,
      },
      {
        street: "Av. Beira Mar",
        neighborhood: "Meireles",
        city: "Fortaleza",
        state: "CE",
        zip: "60165120",
        lat: -3.7219,
        lng: -38.5108,
      },
      {
        street: "Av. Presidente Vargas",
        neighborhood: "Centro",
        city: "Belém",
        state: "PA",
        zip: "66010000",
        lat: -1.4557,
        lng: -48.4902,
      },
      {
        street: "Av. Eduardo Ribeiro",
        neighborhood: "Centro",
        city: "Manaus",
        state: "AM",
        zip: "69010001",
        lat: -3.1319,
        lng: -60.0233,
      },
      {
        street: "Av. CPA",
        neighborhood: "Centro Político",
        city: "Cuiabá",
        state: "MT",
        zip: "78050000",
        lat: -15.6014,
        lng: -56.0979,
      },
      {
        street: "Rua 14 de Julho",
        neighborhood: "Centro",
        city: "Campo Grande",
        state: "MS",
        zip: "79002000",
        lat: -20.4697,
        lng: -54.6201,
      },
      {
        street: "Av. Nossa Senhora da Penha",
        neighborhood: "Santa Lúcia",
        city: "Vitória",
        state: "ES",
        zip: "29045400",
        lat: -20.2976,
        lng: -40.2958,
      },
      {
        street: "Av. Brasil",
        neighborhood: "Centro",
        city: "Campinas",
        state: "SP",
        zip: "13010000",
        lat: -22.9064,
        lng: -47.0616,
      },
      {
        street: "Av. Francisco Junqueira",
        neighborhood: "Centro",
        city: "Ribeirão Preto",
        state: "SP",
        zip: "14010030",
        lat: -21.1704,
        lng: -47.8103,
      },
      {
        street: "Av. General Carneiro",
        neighborhood: "Vila Hortência",
        city: "Sorocaba",
        state: "SP",
        zip: "18030000",
        lat: -23.5015,
        lng: -47.4526,
      },
      {
        street: "Av. das Américas",
        neighborhood: "Barra da Tijuca",
        city: "Rio de Janeiro",
        state: "RJ",
        zip: "22640100",
        lat: -22.9998,
        lng: -43.365,
      },
    ];

    const result: Array<{
      customer: Partial<CustomerEntity>;
      addresses: Partial<CustomerAddressEntity>[];
    }> = [];

    // Criar clientes corporativos (20 empresas) - apenas se offset é 0 (primeira execução)
    if (offset === 0) {
      corporateCustomers.forEach((corp, index) => {
        const category =
          index < 5
            ? CustomerCategory.VIP
            : index < 12
              ? CustomerCategory.PREMIUM
              : CustomerCategory.STANDARD;
        const status = index < 18 ? CustomerStatus.ACTIVE : CustomerStatus.PROSPECT;
        const addr = addresses[index % addresses.length];

        result.push({
          customer: {
            name: corp.name,
            taxId: corp.taxId,
            email: corp.email,
            phone: corp.phone,
            type: CustomerType.CORPORATE,
            status,
            category,
            metadata: {
              segment: index % 2 === 0 ? "Varejo" : "Indústria",
              contractType: category === CustomerCategory.VIP ? "Anual" : "Mensal",
            },
          },
          addresses: [
            {
              street: addr.street,
              number: String(100 + index * 10),
              neighborhood: addr.neighborhood,
              zipCode: addr.zip,
              city: addr.city,
              state: addr.state,
              latitude: addr.lat,
              longitude: addr.lng,
              type: AddressType.COMMERCIAL,
              isPrimary: true,
              isActive: true,
            },
            {
              street: "Rua da Logística",
              number: String(500 + index * 5),
              complement: `Galpão ${index + 1}`,
              neighborhood: "Distrito Industrial",
              zipCode: addr.zip.substring(0, 5) + "999",
              city: addr.city,
              state: addr.state,
              latitude: addr.lat + 0.01,
              longitude: addr.lng + 0.01,
              type: AddressType.SHIPPING,
              isPrimary: false,
              isActive: true,
            },
          ],
        });
      });
    } // fim do if (offset === 0)

    // Criar clientes individuais (130 pessoas) - usar offset para gerar CPFs únicos
    // Multiplicar offset por 1000 para garantir que novos CPFs não colidam com existentes
    for (let i = 0; i < 130; i++) {
      const uniqueIndex = i + offset * 1000; // Multiplicador para garantir unicidade
      const firstName = firstNames[i % firstNames.length];
      const lastName = lastNames[(i + Math.floor(offset / 10)) % lastNames.length];
      const name = `${firstName} ${lastName}`;
      const cpf = this.generateCPF(uniqueIndex);
      const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${uniqueIndex}@email.com.br`;
      const phone = `(${11 + (uniqueIndex % 90)}) 9${String(uniqueIndex % 10000).padStart(4, "0")}-${String((uniqueIndex * 7) % 10000).padStart(4, "0")}`;
      const addr = addresses[i % addresses.length];

      const category =
        i < 10
          ? CustomerCategory.VIP
          : i < 40
            ? CustomerCategory.PREMIUM
            : CustomerCategory.STANDARD;
      const status =
        i < 100
          ? CustomerStatus.ACTIVE
          : i < 120
            ? CustomerStatus.INACTIVE
            : CustomerStatus.PROSPECT;

      result.push({
        customer: {
          name,
          taxId: cpf,
          email,
          phone,
          type: CustomerType.INDIVIDUAL,
          status,
          category,
          metadata: {
            preferredDeliveryTime: i % 2 === 0 ? "morning" : "afternoon",
            receivePromotions: i % 3 !== 0,
          },
        },
        addresses: [
          {
            street: addr.street,
            number: String(100 + i),
            complement: i % 5 === 0 ? `Apto ${100 + i}` : undefined,
            neighborhood: addr.neighborhood,
            zipCode: addr.zip,
            city: addr.city,
            state: addr.state,
            latitude: addr.lat + (i % 100) * 0.001,
            longitude: addr.lng + (i % 100) * 0.001,
            type: AddressType.RESIDENTIAL,
            isPrimary: true,
            isActive: true,
          },
        ],
      });
    }

    return result;
  }

  private generateCPF(seed: number): string {
    // Gerar CPF fictício mas formatado corretamente
    const n1 = (seed * 3 + 1) % 10;
    const n2 = (seed * 5 + 2) % 10;
    const n3 = (seed * 7 + 3) % 10;
    const n4 = (seed * 11 + 4) % 10;
    const n5 = (seed * 13 + 5) % 10;
    const n6 = (seed * 17 + 6) % 10;
    const n7 = (seed * 19 + 7) % 10;
    const n8 = (seed * 23 + 8) % 10;
    const n9 = (seed * 29 + 9) % 10;

    // Dígitos verificadores simplificados (não validam realmente)
    const d1 = (n1 + n2 + n3 + n4 + n5 + n6 + n7 + n8 + n9) % 10;
    const d2 = (d1 + n1 + n2 + n3 + n4 + n5 + n6 + n7 + n8 + n9) % 10;

    return `${n1}${n2}${n3}.${n4}${n5}${n6}.${n7}${n8}${n9}-${d1}${d2}`;
  }
}

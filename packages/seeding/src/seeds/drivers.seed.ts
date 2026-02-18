import { Injectable, Logger, Inject } from "@nestjs/common";
import { Repository, DeepPartial } from "typeorm";
import { ISeed } from "../interfaces/seed.interface";

/**
 * Interface para Driver Entity no seed
 */
export interface DriverEntity {
  id?: string;
  full_name: string;
  cpf: string;
  phone: string;
  email: string;
  status: string;
  availability_status: string;
  birth_date?: Date;
  hire_date?: Date;
}

/**
 * Interface para DriverLicense Entity no seed
 */
export interface DriverLicenseEntity {
  id?: string;
  driver_id?: string;
  driver?: DriverEntity;
  license_number: string;
  category: string;
  issue_date: Date;
  expiration_date: Date;
  issuing_authority: string;
  issuing_state: string;
}

/**
 * Seed de motoristas de exemplo
 *
 * Cria motoristas com CNHs para desenvolvimento e testes
 */
@Injectable()
export class DriversSeed implements ISeed {
  private readonly logger = new Logger(DriversSeed.name);

  constructor(
    @Inject("DRIVER_REPOSITORY")
    private readonly driverRepository: Repository<DriverEntity>,
    @Inject("DRIVER_LICENSE_REPOSITORY")
    private readonly driverLicenseRepository: Repository<DriverLicenseEntity>,
  ) {}

  async run(): Promise<void> {
    this.logger.log("Iniciando seed de motoristas...");

    // Verificar se já existem motoristas suficientes
    const count = await this.driverRepository.count();
    if (count >= 40) {
      this.logger.log(`Já existem ${count} motoristas no sistema. Pulando seed.`);
      return;
    }

    this.logger.log(`Existem ${count} motoristas. Criando mais motoristas...`);

    const driversData = this.getDriversData();
    // Adicionar motoristas gerados dinamicamente
    const additionalDrivers = this.generateAdditionalDrivers(40 - 16); // 16 é o número de motoristas base
    driversData.push(...additionalDrivers);

    for (const driverData of driversData) {
      try {
        // Criar motorista
        const driver = this.driverRepository.create(driverData.driver);
        const savedDriver = await this.driverRepository.save(driver);

        this.logger.log(`Motorista criado: ${savedDriver.full_name}`);

        // Criar CNH do motorista
        if (driverData.license) {
          const license = this.driverLicenseRepository.create({
            ...driverData.license,
            driver: savedDriver,
          } as DeepPartial<DriverLicenseEntity>);
          await this.driverLicenseRepository.save(license);
          this.logger.log(`CNH criada para motorista ${savedDriver.full_name}`);
        }
      } catch (error) {
        this.logger.error(
          `Erro ao criar motorista: ${error instanceof Error ? error.message : "Erro desconhecido"}`,
        );
      }
    }

    this.logger.log(`Seed de motoristas concluído. ${driversData.length} motoristas criados.`);
  }

  private getDriversData(): {
    driver: Partial<DriverEntity>;
    license?: Partial<DriverLicenseEntity>;
  }[] {
    const today = new Date();
    const oneYearAgo = new Date(today);
    oneYearAgo.setFullYear(today.getFullYear() - 1);

    const threeYearsFromNow = new Date(today);
    threeYearsFromNow.setFullYear(today.getFullYear() + 3);

    return [
      {
        driver: {
          full_name: "João Silva Santos",
          cpf: "11144477735",
          phone: "(11) 98765-4321",
          email: "joao.silva@nexustransit.com",
          status: "available",
          availability_status: "available",
          birth_date: new Date("1985-03-15"),
          hire_date: oneYearAgo,
        },
        license: {
          license_number: "12345678901",
          category: "d",
          issue_date: new Date("2020-01-15"),
          expiration_date: threeYearsFromNow,
          issuing_authority: "DETRAN-SP",
          issuing_state: "SP",
        },
      },
      {
        driver: {
          full_name: "Maria Oliveira Costa",
          cpf: "22233344405",
          phone: "(11) 98765-4322",
          email: "maria.oliveira@nexustransit.com",
          status: "available",
          availability_status: "on_route",
          birth_date: new Date("1990-07-22"),
          hire_date: oneYearAgo,
        },
        license: {
          license_number: "98765432109",
          category: "d",
          issue_date: new Date("2019-05-10"),
          expiration_date: threeYearsFromNow,
          issuing_authority: "DETRAN-SP",
          issuing_state: "SP",
        },
      },
      {
        driver: {
          full_name: "Carlos Eduardo Pereira",
          cpf: "33355588831",
          phone: "(11) 98765-4323",
          email: "carlos.pereira@nexustransit.com",
          status: "available",
          availability_status: "available",
          birth_date: new Date("1988-11-30"),
          hire_date: oneYearAgo,
        },
        license: {
          license_number: "45678912345",
          category: "d",
          issue_date: new Date("2021-03-20"),
          expiration_date: threeYearsFromNow,
          issuing_authority: "DETRAN-SP",
          issuing_state: "SP",
        },
      },
      {
        driver: {
          full_name: "Ana Paula Souza",
          cpf: "44466699940",
          phone: "(11) 98765-4324",
          email: "ana.souza@nexustransit.com",
          status: "available",
          availability_status: "unavailable",
          birth_date: new Date("1992-04-18"),
          hire_date: oneYearAgo,
        },
        license: {
          license_number: "78945612301",
          category: "d",
          issue_date: new Date("2020-08-12"),
          expiration_date: threeYearsFromNow,
          issuing_authority: "DETRAN-SP",
          issuing_state: "SP",
        },
      },
      {
        driver: {
          full_name: "Ricardo Alves Ferreira",
          cpf: "55577700094",
          phone: "(11) 98765-4325",
          email: "ricardo.ferreira@nexustransit.com",
          status: "available",
          availability_status: "available",
          birth_date: new Date("1987-09-05"),
          hire_date: oneYearAgo,
        },
        license: {
          license_number: "32165498701",
          category: "e",
          issue_date: new Date("2019-11-25"),
          expiration_date: threeYearsFromNow,
          issuing_authority: "DETRAN-SP",
          issuing_state: "SP",
        },
      },
      {
        driver: {
          full_name: "Fernando Costa Lima",
          cpf: "66688811103",
          phone: "(11) 98765-4326",
          email: "fernando.lima@nexustransit.com",
          status: "available",
          availability_status: "available",
          birth_date: new Date("1991-02-14"),
          hire_date: oneYearAgo,
        },
        license: {
          license_number: "65498732105",
          category: "d",
          issue_date: new Date("2020-06-18"),
          expiration_date: threeYearsFromNow,
          issuing_authority: "DETRAN-SP",
          issuing_state: "SP",
        },
      },
      {
        driver: {
          full_name: "Juliana Mendes Rocha",
          cpf: "77799922259",
          phone: "(11) 98765-4327",
          email: "juliana.rocha@nexustransit.com",
          status: "available",
          availability_status: "on_route",
          birth_date: new Date("1993-08-27"),
          hire_date: oneYearAgo,
        },
        license: {
          license_number: "14785236901",
          category: "d",
          issue_date: new Date("2021-01-10"),
          expiration_date: threeYearsFromNow,
          issuing_authority: "DETRAN-SP",
          issuing_state: "SP",
        },
      },
      {
        driver: {
          full_name: "Roberto Martins Neto",
          cpf: "88800033312",
          phone: "(11) 98765-4328",
          email: "roberto.neto@nexustransit.com",
          status: "available",
          availability_status: "available",
          birth_date: new Date("1986-12-03"),
          hire_date: oneYearAgo,
        },
        license: {
          license_number: "95175382461",
          category: "e",
          issue_date: new Date("2019-09-22"),
          expiration_date: threeYearsFromNow,
          issuing_authority: "DETRAN-SP",
          issuing_state: "SP",
        },
      },
      {
        driver: {
          full_name: "Patrícia Santos Dias",
          cpf: "99911144468",
          phone: "(11) 98765-4329",
          email: "patricia.dias@nexustransit.com",
          status: "available",
          availability_status: "unavailable",
          birth_date: new Date("1994-05-19"),
          hire_date: oneYearAgo,
        },
        license: {
          license_number: "35724189605",
          category: "d",
          issue_date: new Date("2020-11-08"),
          expiration_date: threeYearsFromNow,
          issuing_authority: "DETRAN-SP",
          issuing_state: "SP",
        },
      },
      {
        driver: {
          full_name: "Marcos Vieira Cardoso",
          cpf: "12332145689",
          phone: "(11) 98765-4330",
          email: "marcos.cardoso@nexustransit.com",
          status: "available",
          availability_status: "available",
          birth_date: new Date("1989-10-11"),
          hire_date: oneYearAgo,
        },
        license: {
          license_number: "74185296301",
          category: "d",
          issue_date: new Date("2021-04-15"),
          expiration_date: threeYearsFromNow,
          issuing_authority: "DETRAN-SP",
          issuing_state: "SP",
        },
      },
      {
        driver: {
          full_name: "Luciana Barbosa Freitas",
          cpf: "23456789146",
          phone: "(11) 98765-4331",
          email: "luciana.freitas@nexustransit.com",
          status: "available",
          availability_status: "on_route",
          birth_date: new Date("1995-01-28"),
          hire_date: oneYearAgo,
        },
        license: {
          license_number: "85274196301",
          category: "d",
          issue_date: new Date("2020-02-20"),
          expiration_date: threeYearsFromNow,
          issuing_authority: "DETRAN-SP",
          issuing_state: "SP",
        },
      },
      {
        driver: {
          full_name: "André Luiz Moreira",
          cpf: "34567890257",
          phone: "(11) 98765-4332",
          email: "andre.moreira@nexustransit.com",
          status: "available",
          availability_status: "available",
          birth_date: new Date("1990-06-16"),
          hire_date: oneYearAgo,
        },
        license: {
          license_number: "96385274101",
          category: "e",
          issue_date: new Date("2019-12-05"),
          expiration_date: threeYearsFromNow,
          issuing_authority: "DETRAN-SP",
          issuing_state: "SP",
        },
      },
      {
        driver: {
          full_name: "Camila Fernandes Silva",
          cpf: "45678901368",
          phone: "(11) 98765-4333",
          email: "camila.silva@nexustransit.com",
          status: "available",
          availability_status: "unavailable",
          birth_date: new Date("1992-11-23"),
          hire_date: oneYearAgo,
        },
        license: {
          license_number: "15948267301",
          category: "d",
          issue_date: new Date("2021-07-30"),
          expiration_date: threeYearsFromNow,
          issuing_authority: "DETRAN-SP",
          issuing_state: "SP",
        },
      },
      {
        driver: {
          full_name: "Paulo Henrique Gomes",
          cpf: "56789012479",
          phone: "(11) 98765-4334",
          email: "paulo.gomes@nexustransit.com",
          status: "available",
          availability_status: "available",
          birth_date: new Date("1988-03-09"),
          hire_date: oneYearAgo,
        },
        license: {
          license_number: "75315948201",
          category: "d",
          issue_date: new Date("2020-09-14"),
          expiration_date: threeYearsFromNow,
          issuing_authority: "DETRAN-SP",
          issuing_state: "SP",
        },
      },
      {
        driver: {
          full_name: "Beatriz Araujo Costa",
          cpf: "67890123580",
          phone: "(11) 98765-4335",
          email: "beatriz.costa@nexustransit.com",
          status: "available",
          availability_status: "on_route",
          birth_date: new Date("1996-07-12"),
          hire_date: oneYearAgo,
        },
        license: {
          license_number: "35791482601",
          category: "d",
          issue_date: new Date("2021-05-25"),
          expiration_date: threeYearsFromNow,
          issuing_authority: "DETRAN-SP",
          issuing_state: "SP",
        },
      },
    ];
  }

  /**
   * Gera motoristas adicionais dinamicamente
   */
  private generateAdditionalDrivers(count: number): {
    driver: Partial<DriverEntity>;
    license?: Partial<DriverLicenseEntity>;
  }[] {
    const today = new Date();
    const oneYearAgo = new Date(today);
    oneYearAgo.setFullYear(today.getFullYear() - 1);
    const threeYearsFromNow = new Date(today);
    threeYearsFromNow.setFullYear(today.getFullYear() + 3);

    const firstNames = [
      "Anderson",
      "Bruna",
      "Cristiano",
      "Daiane",
      "Eduardo",
      "Fabiana",
      "Gustavo",
      "Helena",
      "Igor",
      "Juliana",
      "Kleber",
      "Larissa",
      "Marcos",
      "Natália",
      "Otávio",
      "Priscila",
      "Rafael",
      "Sabrina",
      "Thiago",
      "Vanessa",
      "Wesley",
      "Yara",
      "Zilda",
      "Alexandre",
      "Barbara",
      "Caio",
      "Denise",
      "Everton",
      "Flávia",
      "Gilberto",
    ];
    const lastNames = [
      "Mendes",
      "Barbosa",
      "Teixeira",
      "Moreira",
      "Correia",
      "Nunes",
      "Dias",
      "Rezende",
      "Freitas",
      "Cardoso",
      "Pinto",
      "Ramos",
      "Monteiro",
      "Castro",
      "Campos",
    ];
    const statuses = ["available", "available", "available", "unavailable"];
    const availabilities = ["available", "available", "on_route", "unavailable"];
    const categories = ["d", "d", "e", "c"];

    const drivers: {
      driver: Partial<DriverEntity>;
      license?: Partial<DriverLicenseEntity>;
    }[] = [];

    for (let i = 0; i < count; i++) {
      const firstName = firstNames[i % firstNames.length];
      const lastName = lastNames[i % lastNames.length];
      const cpfBase = String(78900000000 + i * 11111).slice(0, 11);
      const licenseNum = String(95000000000 + i * 12345).slice(0, 11);
      const phoneNum = 97650000 + i;

      drivers.push({
        driver: {
          full_name: `${firstName} ${lastName} Junior`,
          cpf: cpfBase,
          phone: `(11) ${String(phoneNum).slice(0, 5)}-${String(phoneNum).slice(5)}`,
          email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i}@nexustransit.com`,
          status: statuses[i % statuses.length],
          availability_status: availabilities[i % availabilities.length],
          birth_date: new Date(1980 + (i % 20), i % 12, (i % 28) + 1),
          hire_date: oneYearAgo,
        },
        license: {
          license_number: licenseNum,
          category: categories[i % categories.length],
          issue_date: new Date(2019 + (i % 3), i % 12, 1),
          expiration_date: threeYearsFromNow,
          issuing_authority: "DETRAN-SP",
          issuing_state: "SP",
        },
      });
    }

    return drivers;
  }
}

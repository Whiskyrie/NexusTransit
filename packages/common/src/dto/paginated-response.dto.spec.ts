import { PaginatedResponseDto, PaginationMetaDto } from "./paginated-response.dto";

describe("PaginatedResponseDto", () => {
  describe("PaginationMetaDto", () => {
    it("deve criar metadados de paginação", () => {
      const meta: PaginationMetaDto = {
        page: 1,
        limit: 10,
        total: 100,
        total_pages: 10,
        has_previous: false,
        has_next: true,
      };

      expect(meta.page).toBe(1);
      expect(meta.limit).toBe(10);
      expect(meta.total).toBe(100);
      expect(meta.total_pages).toBe(10);
      expect(meta.has_previous).toBe(false);
      expect(meta.has_next).toBe(true);
    });
  });

  describe("PaginatedResponseDto.create", () => {
    interface TestItem {
      id: string;
      name: string;
    }

    it("deve criar resposta paginada com dados corretos", () => {
      const data: TestItem[] = [
        { id: "1", name: "Item 1" },
        { id: "2", name: "Item 2" },
      ];

      const response = PaginatedResponseDto.create(data, 1, 10, 100);

      expect(response.data).toEqual(data);
      expect(response.meta.page).toBe(1);
      expect(response.meta.limit).toBe(10);
      expect(response.meta.total).toBe(100);
      expect(response.meta.total_pages).toBe(10);
    });

    it("deve calcular total_pages corretamente", () => {
      const data: TestItem[] = [];

      // 25 itens com limite de 10 = 3 páginas
      const response = PaginatedResponseDto.create(data, 1, 10, 25);

      expect(response.meta.total_pages).toBe(3);
    });

    it("deve calcular has_previous corretamente", () => {
      const data: TestItem[] = [];

      const page1 = PaginatedResponseDto.create(data, 1, 10, 100);
      expect(page1.meta.has_previous).toBe(false);

      const page2 = PaginatedResponseDto.create(data, 2, 10, 100);
      expect(page2.meta.has_previous).toBe(true);

      const page5 = PaginatedResponseDto.create(data, 5, 10, 100);
      expect(page5.meta.has_previous).toBe(true);
    });

    it("deve calcular has_next corretamente", () => {
      const data: TestItem[] = [];

      const page1 = PaginatedResponseDto.create(data, 1, 10, 100);
      expect(page1.meta.has_next).toBe(true);

      const page9 = PaginatedResponseDto.create(data, 9, 10, 100);
      expect(page9.meta.has_next).toBe(true);

      const page10 = PaginatedResponseDto.create(data, 10, 10, 100);
      expect(page10.meta.has_next).toBe(false);
    });

    it("deve lidar com total = 0", () => {
      const data: TestItem[] = [];

      const response = PaginatedResponseDto.create(data, 1, 10, 0);

      expect(response.meta.total).toBe(0);
      expect(response.meta.total_pages).toBe(0);
      expect(response.meta.has_previous).toBe(false);
      expect(response.meta.has_next).toBe(false);
    });

    it("deve lidar com página única", () => {
      const data: TestItem[] = [{ id: "1", name: "Item 1" }];

      const response = PaginatedResponseDto.create(data, 1, 10, 5);

      expect(response.meta.total_pages).toBe(1);
      expect(response.meta.has_previous).toBe(false);
      expect(response.meta.has_next).toBe(false);
    });

    it("deve lidar com diferentes tipos de dados", () => {
      const stringData = ["a", "b", "c"];

      const response = PaginatedResponseDto.create(stringData, 1, 10, 3);

      expect(response.data).toEqual(stringData);
      expect(response.meta.total).toBe(3);
    });

    it("deve arredondar total_pages para cima", () => {
      const data: TestItem[] = [];

      // 21 itens com limite de 10 = 3 páginas (ceil)
      const response = PaginatedResponseDto.create(data, 1, 10, 21);

      expect(response.meta.total_pages).toBe(3);
    });
  });
});

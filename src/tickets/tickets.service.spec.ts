import { Test, TestingModule } from '@nestjs/testing';
import { TicketsService } from './tickets.service';
import { DrizzleAsyncProvider } from '../drizzle/drizzle.provider';
import { NotFoundException } from '@nestjs/common';
import { Role } from '../auth/roles';

// Mock pdf
jest.mock('pdfkit', () => {
  return class PDFDocument {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
    on(event: string, callback: Function) {
      if (event === 'data') callback(Buffer.from('pdf-chunk'));
      if (event === 'end') callback();
      return this;
    }
    fontSize() {
      return this;
    }
    text() {
      return this;
    }
    image() {
      return this;
    }
    end() {
      return this;
    }
    fillColor() {
      return this;
    }
    rect() {
      return this;
    }
    stroke() {
      return this;
    }
    font() {
      return this;
    }
    moveDown() {
      return this;
    }
    moveTo() {
      return this;
    }
    lineTo() {
      return this;
    }
  };
});

// MOCK DATABASE
const mockDb = {
  query: {
    tickets: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
    },
  },
  insert: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
};

const createChainableMock = (resolvedValue: any) => {
  return {
    values: jest.fn().mockReturnThis(),
    set: jest.fn().mockReturnThis(),
    where: jest.fn().mockResolvedValue(resolvedValue),
    $returningId: jest.fn().mockResolvedValue(resolvedValue),
  };
};

describe('TicketsService', () => {
  let service: TicketsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TicketsService,
        {
          provide: DrizzleAsyncProvider,
          useValue: mockDb,
        },
      ],
    }).compile();

    service = module.get<TicketsService>(TicketsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return a list of tickets', async () => {
      const mockTickets = [
        { id: 1, price: '50.00', type: 'VIP', user: {}, event: {} },
      ];
      mockDb.query.tickets.findMany.mockResolvedValue(mockTickets);

      const result = await service.findAll(1, [Role.ADMIN]);

      expect(result.items).toHaveLength(1);
      expect(result.items[0].id).toBe(1);
      expect(mockDb.query.tickets.findMany).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return a ticket if found', async () => {
      const mockTicket = {
        id: 1,
        price: '50.00',
        type: 'VIP',
        user: {},
        event: {},
      };
      mockDb.query.tickets.findFirst.mockResolvedValue(mockTicket);

      const result = await service.findOne(1, 1, [Role.USER]);
      expect(result.id).toBe(1);
    });

    it('should throw NotFoundException if ticket does not exist', async () => {
      mockDb.query.tickets.findFirst.mockResolvedValue(null);

      await expect(service.findOne(999, 1, [Role.USER])).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('create', () => {
    it('should create a ticket and return it', async () => {
      const dto = { price: 50, type: 'VIP', eventId: 1, userId: 1 };
      const newTicketId = { id: 1 };

      const insertChain = createChainableMock([newTicketId]);
      mockDb.insert.mockReturnValue(insertChain);

      mockDb.query.tickets.findFirst.mockResolvedValue({
        id: 1,
        price: '50.00',
        type: 'VIP',
        user: {},
        event: {},
      });

      const result = await service.create(dto, 1);

      expect(result.id).toBe(1);
      expect(mockDb.insert).toHaveBeenCalled();
    });
  });

  describe('updateById', () => {
    it('should throw NotFoundException if update affects 0 rows', async () => {
      const updateChain = createChainableMock([{ affectedRows: 0 }]);
      mockDb.update.mockReturnValue(updateChain);

      await expect(
        service.updateById(999, { type: 'New' }, 1, [Role.ADMIN]),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should delete a ticket', async () => {
      const deleteChain = createChainableMock([{ affectedRows: 1 }]);
      mockDb.delete.mockReturnValue(deleteChain);

      await expect(service.remove(1, 1, [Role.ADMIN])).resolves.toBeUndefined();
    });

    it('should throw NotFoundException if ticket to delete does not exist', async () => {
      const deleteChain = createChainableMock([{ affectedRows: 0 }]);
      mockDb.delete.mockReturnValue(deleteChain);

      await expect(service.remove(999, 1, [Role.ADMIN])).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  //pdf test
  describe('generateTicketPdf', () => {
    it('should generate a PDF buffer', async () => {
      mockDb.query.tickets.findFirst.mockResolvedValue({
        id: 1,
        price: '50.00',
        type: 'VIP',
        uuid: 'test-uuid-123',
        user: { name: 'Test User' },
        event: {
          name: 'Test Event',
          date: new Date(),
          start_time: '20:00',
          end_time: '23:00',
          location: {
            name: 'Ghelamco Arena',
            street: 'Ottergemsesteenweg',
            city: 'Gent',
            country: 'BE',
          },
        },
      });

      const result = await service.generateTicketPdf(1);

      expect(result).toBeInstanceOf(Buffer);
      expect(mockDb.query.tickets.findFirst).toHaveBeenCalled();
    });

    it('should throw NotFoundException if ticket for PDF not found', async () => {
      mockDb.query.tickets.findFirst.mockResolvedValue(null);
      await expect(service.generateTicketPdf(999)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});

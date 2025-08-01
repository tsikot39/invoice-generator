import { NextRequest } from 'next/server';
import { GET, POST } from '@/app/api/clients/route';
import { auth } from '@/lib/auth-helper';
import { ClientModel } from '@/lib/models';
import dbConnect from '@/lib/mongodb';

// Mock dependencies
jest.mock('@/lib/auth-helper');
jest.mock('@/lib/models');
jest.mock('@/lib/mongodb');
jest.mock('@/lib/cache-utils');

const mockAuth = auth as jest.MockedFunction<typeof auth>;
const mockDbConnect = dbConnect as jest.MockedFunction<typeof dbConnect>;
const mockClientModel = {
  find: jest.fn(),
  create: jest.fn(),
  countDocuments: jest.fn(),
} as any;

(ClientModel as any).find = mockClientModel.find;
(ClientModel as any).create = mockClientModel.create;
(ClientModel as any).countDocuments = mockClientModel.countDocuments;

describe('/api/clients', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockDbConnect.mockResolvedValue({});
  });

  describe('GET /api/clients', () => {
    it('should return 401 if user is not authenticated', async () => {
      mockAuth.mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/clients');
      const response = await GET(request);

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.error).toBe('Unauthorized');
    });

    it('should return clients list with pagination', async () => {
      mockAuth.mockResolvedValue({
        user: { email: 'test@example.com' },
      } as any);

      const mockClients = [
        { _id: '1', name: 'Client 1', email: 'client1@example.com' },
        { _id: '2', name: 'Client 2', email: 'client2@example.com' },
      ];

      mockClientModel.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          limit: jest.fn().mockReturnValue({
            skip: jest.fn().mockReturnValue({
              lean: jest.fn().mockResolvedValue(mockClients),
            }),
          }),
        }),
      });

      mockClientModel.countDocuments.mockResolvedValue(2);

      const request = new NextRequest('http://localhost:3000/api/clients?page=1&limit=10');
      const response = await GET(request);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data.clients).toHaveLength(2);
      expect(data.data.pagination.total).toBe(2);
    });

    it('should handle search functionality', async () => {
      mockAuth.mockResolvedValue({
        user: { email: 'test@example.com' },
      } as any);

      mockClientModel.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          limit: jest.fn().mockReturnValue({
            skip: jest.fn().mockReturnValue({
              lean: jest.fn().mockResolvedValue([]),
            }),
          }),
        }),
      });

      mockClientModel.countDocuments.mockResolvedValue(0);

      const request = new NextRequest(
        'http://localhost:3000/api/clients?search=test&page=1&limit=10'
      );
      const response = await GET(request);

      expect(response.status).toBe(200);
      // Verify that search was applied to the query
      expect(mockClientModel.find).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'test@example.com',
          $or: expect.arrayContaining([
            expect.objectContaining({ name: expect.any(Object) }),
            expect.objectContaining({ email: expect.any(Object) }),
          ]),
        })
      );
    });
  });

  describe('POST /api/clients', () => {
    it('should return 401 if user is not authenticated', async () => {
      mockAuth.mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/clients', {
        method: 'POST',
        body: JSON.stringify({ name: 'Test Client', email: 'test@example.com' }),
      });

      const response = await POST(request);
      expect(response.status).toBe(401);
    });

    it('should create a new client successfully', async () => {
      mockAuth.mockResolvedValue({
        user: { email: 'test@example.com' },
      } as any);

      const newClient = {
        _id: 'new-client-id',
        name: 'New Client',
        email: 'new@example.com',
        userId: 'test@example.com',
        toObject: () => ({
          _id: 'new-client-id',
          name: 'New Client',
          email: 'new@example.com',
          userId: 'test@example.com',
        }),
      };

      mockClientModel.create.mockResolvedValue(newClient);

      const request = new NextRequest('http://localhost:3000/api/clients', {
        method: 'POST',
        body: JSON.stringify({
          name: 'New Client',
          email: 'new@example.com',
          phone: '123-456-7890',
          address: '123 Test St',
        }),
      });

      const response = await POST(request);
      expect(response.status).toBe(201);

      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data.client.name).toBe('New Client');
    });

    it('should return 400 for validation errors', async () => {
      mockAuth.mockResolvedValue({
        user: { email: 'test@example.com' },
      } as any);

      const request = new NextRequest('http://localhost:3000/api/clients', {
        method: 'POST',
        body: JSON.stringify({
          // Missing required name field
          email: 'invalid-email',
        }),
      });

      const response = await POST(request);
      expect(response.status).toBe(400);

      const data = await response.json();
      expect(data.error).toBe('Validation failed');
    });
  });
});

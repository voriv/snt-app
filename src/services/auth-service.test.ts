import { AuthService } from './auth-service';
import { UserRepository } from './user-repository.interface';
import * as bcrypt from 'bcryptjs';
import { ValidationError, ConflictError } from './_lib/errors';

// Mock bcrypt
jest.mock('bcryptjs');
const mockBcryptHash = jest.fn();
jest.spyOn(bcrypt, 'hash').mockImplementation(mockBcryptHash);

describe('AuthService.register()', () => {
  let authService: AuthService;
  let mockUserRepository: jest.Mocked<UserRepository>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockUserRepository = {
      findByEmail: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      saveResetToken: jest.fn(),
      clearResetToken: jest.fn(),
    } as unknown as jest.Mocked<UserRepository>;

    authService = new AuthService(mockUserRepository);
  });

  describe('Validation', () => {
    it('should throw ValidationError if email is empty', async () => {
      await expect(
        authService.register({ email: '', password: 'password123' } as any)
      ).rejects.toThrow(ValidationError);
      expect(mockBcryptHash).not.toHaveBeenCalled();
      expect(mockUserRepository.findByEmail).not.toHaveBeenCalled();
    });

    it('should throw ValidationError if email is invalid format', async () => {
      await expect(
        authService.register({ email: 'invalid-email', password: 'password123' })
      ).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError if password is empty', async () => {
      await expect(
        authService.register({ email: 'test@example.com', password: '' } as any)
      ).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError if password is too short', async () => {
      await expect(
        authService.register({ email: 'test@example.com', password: '123' })
      ).rejects.toThrow(ValidationError);
    });
  });

  describe('Business Logic', () => {
    beforeEach(() => {
      mockBcryptHash.mockResolvedValue('hashedPassword');
    });

    it('should throw ConflictError if email is already taken', async () => {
      const existingUser = { id: '1', email: 'test@example.com', passwordHash: 'hash', role: 'USER' };
      mockUserRepository.findByEmail.mockResolvedValue(existingUser);

      await expect(
        authService.register({ email: 'test@example.com', password: 'password123' })
      ).rejects.toThrow(ConflictError);

      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith('test@example.com');
      expect(mockBcryptHash).not.toHaveBeenCalled();
      expect(mockUserRepository.create).not.toHaveBeenCalled();
    });

    it('should successfully register a new user with correct parameters', async () => {
      const mockUser = { id: '1', email: 'new@example.com', name: 'Test User', role: 'GUEST' };
      mockUserRepository.findByEmail.mockResolvedValue(null);
      mockUserRepository.create.mockResolvedValue(mockUser);

      const result = await authService.register({
        email: 'new@example.com',
        password: 'password123',
        name: 'Test User',
      });

      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith('new@example.com');
      expect(mockBcryptHash).toHaveBeenCalledWith('password123', 12);
      expect(mockUserRepository.create).toHaveBeenCalledWith({
        email: 'new@example.com',
        passwordHash: 'hashedPassword',
        name: 'Test User',
        role: 'GUEST',
        isActive: true,
      });
      expect(result.user).toEqual({
        id: '1',
        email: 'new@example.com',
        name: 'Test User',
        role: 'GUEST',
      });
    });

    it('should handle registration without optional name field', async () => {
      const mockUser = { id: '2', email: 'simple@example.com', name: null, role: 'GUEST' };
      mockUserRepository.findByEmail.mockResolvedValue(null);
      mockUserRepository.create.mockResolvedValue(mockUser);

      await authService.register({
        email: 'simple@example.com',
        password: 'password123',
      });

      expect(mockUserRepository.create).toHaveBeenCalledWith({
        email: 'simple@example.com',
        passwordHash: 'hashedPassword',
        name: undefined,
        role: 'GUEST',
        isActive: true,
      });
    });
  });
});

import * as fs from 'fs';
import * as path from 'path';

interface DomainArgs {
  name: string;
  singular: string;
}

function toPascalCase(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function toCamelCase(str: string): string {
  return str.charAt(0).toLowerCase() + str.slice(1);
}

function generateDomain(args: DomainArgs) {
  const { name, singular } = args;
  const pascalName = toPascalCase(name);
  const camelName = toCamelCase(name);
  const singularPascal = toPascalCase(singular);
  const singularCamel = toCamelCase(singular);

  const domainDir = path.join(process.cwd(), 'src', 'domains', name);
  const componentsDir = path.join(process.cwd(), 'src', 'components', 'features', name);

  // Create directories
  fs.mkdirSync(domainDir, { recursive: true });
  fs.mkdirSync(componentsDir, { recursive: true });

  // Generate types
  const typesContent = `export interface ${singularPascal} {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Create${singularPascal}Input {
  // Add fields here
}

export interface Update${singularPascal}Input {
  // Add fields here
}
`;

  fs.writeFileSync(path.join(domainDir, `${singularCamel}.types.ts`), typesContent);

  // Generate errors
  const errorsContent = `import { NotFoundError, ValidationError, ConflictError } from '@/shared/errors';

export class ${singularPascal}NotFoundError extends NotFoundError {
  constructor(id: string) {
    super(${singularPascal}, id);
  }
}

export class ${singularPascal}DuplicateError extends ConflictError {
  constructor(field: string, value: string) {
    super(\`${singularPascal} with \${field} \${value} already exists\`);
  }
}

export class ${singularPascal}InvalidDataError extends ValidationError {
  constructor(message: string) {
    super(\`${singularPascal} data invalid: \${message}\`);
  }
}
`;

  fs.writeFileSync(path.join(domainDir, `${singularCamel}.errors.ts`), errorsContent);

  // Generate repository interface
  const repositoryInterfaceContent = `import type { ${singularPascal}, Create${singularPascal}Input, Update${singularPascal}Input } from './${singularCamel}.types';

export interface I${singularPascal}Repository {
  findById(id: string): Promise<${singularPascal} | null>;
  findAll(): Promise<${singularPascal}[]>;
  create(data: Create${singularPascal}Input): Promise<${singularPascal}>;
  update(id: string, data: Update${singularPascal}Input): Promise<${singularPascal}>;
  delete(id: string): Promise<void>;
}
`;

  fs.writeFileSync(path.join(domainDir, `${singularCamel}.repository.interface.ts`), repositoryInterfaceContent);

  // Generate repository implementation
  const repositoryImplContent = `import { prisma } from '@/infrastructure/prisma/client';
import type { I${singularPascal}Repository } from './${singularCamel}.repository.interface';
import type { ${singularPascal}, Create${singularPascal}Input, Update${singularPascal}Input } from './${singularCamel}.types';

export class ${singularPascal}Repository implements I${singularPascal}Repository {
  async findById(id: string): Promise<${singularPascal} | null> {
    return prisma.${singularCamel}.findUnique({ where: { id } });
  }

  async findAll(): Promise<${singularPascal}[]> {
    return prisma.${singularCamel}.findMany();
  }

  async create(data: Create${singularPascal}Input): Promise<${singularPascal}> {
    return prisma.${singularCamel}.create({ data });
  }

  async update(id: string, data: Update${singularPascal}Input): Promise<${singularPascal}> {
    return prisma.${singularCamel}.update({
      where: { id },
      data,
    });
  }

  async delete(id: string): Promise<void> {
    await prisma.${singularCamel}.delete({ where: { id } });
  }
}
`;

  fs.writeFileSync(path.join(domainDir, `${singularCamel}.repository.prisma.ts`), repositoryImplContent);

  // Generate validators
  const validatorsContent = `import { z } from 'zod';

export const ${singularCamel}CreateSchema = z.object({
  // Add validation schemas here
});

export const ${singularCamel}UpdateSchema = z.object({
  // Add validation schemas here
});

export type Create${singularPascal}Input = z.infer<typeof ${singularCamel}CreateSchema>;
export type Update${singularPascal}Input = z.infer<typeof ${singularCamel}UpdateSchema>;
`;

  fs.writeFileSync(path.join(domainDir, `${singularCamel}.validators.ts`), validatorsContent);

  // Generate service
  const serviceContent = `import type { I${singularPascal}Repository } from './${singularCamel}.repository.interface';
import { ${singularPascal}Repository } from './${singularCamel}.repository.prisma';
import { ${singularPascal}NotFoundError } from './${singularCamel}.errors';
import type { ${singularPascal}, Create${singularPascal}Input, Update${singularPascal}Input } from './${singularCamel}.types';

export class ${singularPascal}Service {
  constructor(private readonly repository: I${singularPascal}Repository = new ${singularPascal}Repository()) {}

  async findById(id: string): Promise<${singularPascal}> {
    const member = await this.repository.findById(id);
    if (!member) {
      throw new ${singularPascal}NotFoundError(id);
    }
    return member;
  }

  async findAll(): Promise<${singularPascal}[]> {
    return this.repository.findAll();
  }

  async create(data: Create${singularPascal}Input): Promise<${singularPascal}> {
    return this.repository.create(data);
  }

  async update(id: string, data: Update${singularPascal}Input): Promise<${singularPascal}> {
    return this.repository.update(id, data);
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }
}
`;

  fs.writeFileSync(path.join(domainDir, `${singularCamel}.service.ts`), serviceContent);

  // Generate index
  const indexContent = `export { ${singularPascal}Service } from './${singularCamel}.service';
export type { I${singularPascal}Repository } from './${singularCamel}.repository.interface';
export type { ${singularPascal}, Create${singularPascal}Input, Update${singularPascal}Input } from './${singularCamel}.types';
`;

  fs.writeFileSync(path.join(domainDir, 'index.ts'), indexContent);

  console.log(`✅ Domain "${name}" created successfully!`);
  console.log(`   Location: ${domainDir}`);
  console.log(`   Components: ${componentsDir}`);
}

if (require.main === module) {
  const args = process.argv.slice(2);
  const name = args[0];
  const singular = args[1] || name;

  if (!name) {
    console.error('❌ Please provide a domain name');
    console.error('Usage: tsx scripts/generate-domain.ts <name> [singular]');
    process.exit(1);
  }

  generateDomain({ name, singular });
}

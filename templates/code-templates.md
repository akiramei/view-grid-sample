# コードテンプレート集

## 🎯 よく使うコードパターン

実装時にコピー&ペーストして使えるコードテンプレート集です。プロジェクトの設計方針に沿った実装パターンを提供しています。

## 🏗️ Repository層テンプレート

### 基本Repository実装

```typescript
// src/infrastructure/repositories/dexie-[entity]-repository.ts
import { [Entity]Repository } from '@/core/interfaces/repositories';
import { [Entity] } from '@/shared/types';
import { db } from './database';
import { v4 as uuidv4 } from 'uuid';

export class Dexie[Entity]Repository implements [Entity]Repository {
  async findAll(): Promise<[Entity][]> {
    return await db.[entityTable].orderBy('createdAt').reverse().toArray();
  }

  async findById(id: string): Promise<[Entity] | null> {
    return await db.[entityTable].get(id) || null;
  }

  async create(entity: Omit<[Entity], 'id' | 'createdAt'>): Promise<[Entity]> {
    const newEntity: [Entity] = {
      ...entity,
      id: uuidv4(),
      createdAt: new Date().toISOString(),
    };
    
    await db.[entityTable].add(newEntity);
    return newEntity;
  }

  async update(id: string, updates: Partial<[Entity]>): Promise<void> {
    await db.[entityTable].update(id, {
      ...updates,
      updatedAt: new Date().toISOString(),
    });
  }

  async delete(id: string): Promise<void> {
    await db.[entityTable].delete(id);
  }

  // カスタムクエリ例
  async findByCondition(condition: string): Promise<[Entity][]> {
    return await db.[entityTable]
      .where('conditionField')
      .equals(condition)
      .toArray();
  }
}
```

### エラーハンドリング付きRepository

```typescript
import { Result, ok, err } from 'neverthrow';

export class SafeDexie[Entity]Repository implements [Entity]Repository {
  async create(entity: Omit<[Entity], 'id' | 'createdAt'>): Promise<Result<[Entity], string>> {
    try {
      const newEntity: [Entity] = {
        ...entity,
        id: uuidv4(),
        createdAt: new Date().toISOString(),
      };
      
      await db.[entityTable].add(newEntity);
      return ok(newEntity);
    } catch (error) {
      console.error('Failed to create entity:', error);
      return err(`Failed to create entity: ${error.message}`);
    }
  }

  async findAll(): Promise<Result<[Entity][], string>> {
    try {
      const entities = await db.[entityTable].orderBy('createdAt').reverse().toArray();
      return ok(entities);
    } catch (error) {
      console.error('Failed to fetch entities:', error);
      return err(`Failed to fetch entities: ${error.message}`);
    }
  }
}
```

## 📊 Zustand Store テンプレート

### 基本Store構造

```typescript
// src/application/stores/[entity]-store.ts
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { [Entity] } from '@/shared/types';

interface [Entity]State {
  // データ
  [entityPlural]: [Entity][];
  selected[Entity]Id: string | null;
  
  // UI状態
  isLoading: boolean;
  error: string | null;
  
  // アクション
  set[EntityPlural]: (entities: [Entity][]) => void;
  add[Entity]: (entity: [Entity]) => void;
  update[Entity]: (id: string, updates: Partial<[Entity]>) => void;
  remove[Entity]: (id: string) => void;
  select[Entity]: (id: string | null) => void;
  
  // 非同期アクション
  load[EntityPlural]: () => Promise<void>;
  create[Entity]: (data: Omit<[Entity], 'id' | 'createdAt'>) => Promise<void>;
}

export const use[Entity]Store = create<[Entity]State>()(
  immer((set, get) => ({
    // 初期状態
    [entityPlural]: [],
    selected[Entity]Id: null,
    isLoading: false,
    error: null,

    // 同期アクション
    set[EntityPlural]: (entities) =>
      set((state) => {
        state.[entityPlural] = entities;
      }),

    add[Entity]: (entity) =>
      set((state) => {
        state.[entityPlural].push(entity);
      }),

    update[Entity]: (id, updates) =>
      set((state) => {
        const index = state.[entityPlural].findIndex(e => e.id === id);
        if (index !== -1) {
          Object.assign(state.[entityPlural][index], updates);
          state.[entityPlural][index].updatedAt = new Date().toISOString();
        }
      }),

    remove[Entity]: (id) =>
      set((state) => {
        state.[entityPlural] = state.[entityPlural].filter(e => e.id !== id);
        if (state.selected[Entity]Id === id) {
          state.selected[Entity]Id = null;
        }
      }),

    select[Entity]: (id) =>
      set((state) => {
        state.selected[Entity]Id = id;
      }),

    // 非同期アクション
    load[EntityPlural]: async () => {
      set((state) => {
        state.isLoading = true;
        state.error = null;
      });

      try {
        const repository = get[Entity]Repository();
        const entities = await repository.findAll();
        
        set((state) => {
          state.[entityPlural] = entities;
          state.isLoading = false;
        });
      } catch (error) {
        set((state) => {
          state.error = error.message;
          state.isLoading = false;
        });
      }
    },

    create[Entity]: async (data) => {
      set((state) => {
        state.isLoading = true;
        state.error = null;
      });

      try {
        const repository = get[Entity]Repository();
        const newEntity = await repository.create(data);
        
        set((state) => {
          state.[entityPlural].push(newEntity);
          state.isLoading = false;
        });
      } catch (error) {
        set((state) => {
          state.error = error.message;
          state.isLoading = false;
        });
      }
    },
  }))
);
```

## 🎣 Custom Hook テンプレート

### 基本Hook構造

```typescript
// src/application/hooks/use-[entity].ts
import { useEffect } from 'react';
import { use[Entity]Store } from '@/application/stores/[entity]-store';
import { get[Entity]Repository } from '@/infrastructure/di-container';
import toast from 'react-hot-toast';

export function use[EntityPlural]() {
  const {
    [entityPlural],
    selected[Entity]Id,
    isLoading,
    error,
    load[EntityPlural],
    create[Entity],
    update[Entity],
    remove[Entity],
    select[Entity],
  } = use[Entity]Store();

  // 初期データ読み込み
  useEffect(() => {
    load[EntityPlural]();
  }, [load[EntityPlural]]);

  // エラーハンドリング
  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  const handleCreate = async (data: Omit<[Entity], 'id' | 'createdAt'>) => {
    try {
      await create[Entity](data);
      toast.success('[Entity] created successfully');
    } catch (error) {
      toast.error(`Failed to create [entity]: ${error.message}`);
    }
  };

  const handleUpdate = async (id: string, updates: Partial<[Entity]>) => {
    try {
      await update[Entity](id, updates);
      toast.success('[Entity] updated successfully');
    } catch (error) {
      toast.error(`Failed to update [entity]: ${error.message}`);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this [entity]?')) {
      return;
    }

    try {
      await remove[Entity](id);
      toast.success('[Entity] deleted successfully');
    } catch (error) {
      toast.error(`Failed to delete [entity]: ${error.message}`);
    }
  };

  const selected[Entity] = [entityPlural].find(e => e.id === selected[Entity]Id);

  return {
    // データ
    [entityPlural],
    selected[Entity],
    isLoading,
    
    // アクション
    create: handleCreate,
    update: handleUpdate,
    delete: handleDelete,
    select: select[Entity],
  };
}
```

### ファイルアップロード Hook

```typescript
// src/application/hooks/use-file-upload.ts
import { useCallback } from 'react';
import { FileUploadService } from '@/infrastructure/services/file-upload-service';
import toast from 'react-hot-toast';

const fileUploadService = new FileUploadService();

export function useFileUpload() {
  const uploadFiles = useCallback(async (
    files: FileList,
    onSuccess?: (results: UploadResult[]) => void
  ) => {
    const results: UploadResult[] = [];
    
    for (const file of Array.from(files)) {
      try {
        const result = await fileUploadService.uploadImage(file);
        results.push({ file, result, success: true });
        toast.success(`${file.name} uploaded successfully`);
      } catch (error) {
        results.push({ file, error, success: false });
        toast.error(`Failed to upload ${file.name}: ${error.message}`);
      }
    }
    
    if (onSuccess) {
      onSuccess(results);
    }
    
    return results;
  }, []);

  const uploadSingleFile = useCallback(async (file: File) => {
    try {
      const result = await fileUploadService.uploadImage(file);
      toast.success(`${file.name} uploaded successfully`);
      return result;
    } catch (error) {
      toast.error(`Failed to upload ${file.name}: ${error.message}`);
      throw error;
    }
  }, []);

  return {
    uploadFiles,
    uploadSingleFile,
  };
}

interface UploadResult {
  file: File;
  result?: any;
  error?: Error;
  success: boolean;
}
```

## 🎨 React Component テンプレート

### 基本Component構造

```typescript
// src/presentation/components/[ComponentName].tsx
import React from 'react';
import { cn } from '@/shared/utils/cn'; // clsx wrapper

interface [ComponentName]Props {
  className?: string;
  // その他のprops
}

export function [ComponentName]({ className, ...props }: [ComponentName]Props) {
  return (
    <div className={cn('base-classes', className)}>
      {/* Component content */}
    </div>
  );
}

// Default props (optional)
[ComponentName].defaultProps = {
  // default values
};
```

### フォームComponent

```typescript
// src/presentation/components/[Entity]Form.tsx
import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { [Entity] } from '@/shared/types';

const [entity]Schema = z.object({
  name: z.string().min(1, 'Name is required'),
  // その他のフィールド
});

type [Entity]FormData = z.infer<typeof [entity]Schema>;

interface [Entity]FormProps {
  initialData?: Partial<[Entity]>;
  onSubmit: (data: [Entity]FormData) => void;
  onCancel?: () => void;
  isLoading?: boolean;
}

export function [Entity]Form({ 
  initialData, 
  onSubmit, 
  onCancel, 
  isLoading = false 
}: [Entity]FormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    reset,
  } = useForm<[Entity]FormData>({
    resolver: zodResolver([entity]Schema),
    defaultValues: initialData,
  });

  const handleFormSubmit = (data: [Entity]FormData) => {
    onSubmit(data);
    reset();
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700">
          Name
        </label>
        <input
          {...register('name')}
          type="text"
          id="name"
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
          disabled={isLoading}
        />
        {errors.name && (
          <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
        )}
      </div>

      <div className="flex justify-end space-x-2">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={!isValid || isLoading}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {isLoading ? 'Saving...' : 'Save'}
        </button>
      </div>
    </form>
  );
}
```

### Modal Component

```typescript
// src/presentation/components/Modal.tsx
import React, { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const sizeClasses = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
};

export function Modal({ isOpen, onClose, title, children, size = 'md' }: ModalProps) {
  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel 
                className={`w-full ${sizeClasses[size]} transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all`}
              >
                <div className="flex items-center justify-between mb-4">
                  <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900">
                    {title}
                  </Dialog.Title>
                  <button
                    onClick={onClose}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X size={20} />
                  </button>
                </div>
                
                {children}
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
```

## 🎯 Service層テンプレート

### 基本Service構造

```typescript
// src/infrastructure/services/[service-name]-service.ts
export interface [Service]Service {
  [method](param: ParamType): Promise<ReturnType>;
}

export class [ConcreteService] implements [Service]Service {
  async [method](param: ParamType): Promise<ReturnType> {
    try {
      // 実装
      return result;
    } catch (error) {
      console.error(`[Service] ${method} failed:`, error);
      throw new Error(`Failed to ${method}: ${error.message}`);
    }
  }

  private async [helperMethod](param: any): Promise<any> {
    // ヘルパーメソッド
  }
}
```

## 🧪 テストテンプレート

### Repository テスト

```typescript
// src/infrastructure/repositories/__tests__/[entity]-repository.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { Dexie[Entity]Repository } from '../dexie-[entity]-repository';
import { [Entity] } from '@/shared/types';

describe('Dexie[Entity]Repository', () => {
  let repository: Dexie[Entity]Repository;

  beforeEach(() => {
    repository = new Dexie[Entity]Repository();
    // テスト用データベースリセット
  });

  it('should create a new entity', async () => {
    const entityData = {
      name: 'Test Entity',
      // その他のフィールド
    };

    const result = await repository.create(entityData);

    expect(result).toHaveProperty('id');
    expect(result.name).toBe(entityData.name);
    expect(result).toHaveProperty('createdAt');
  });

  it('should find all entities', async () => {
    // テストデータ作成
    await repository.create({ name: 'Entity 1' });
    await repository.create({ name: 'Entity 2' });

    const results = await repository.findAll();

    expect(results).toHaveLength(2);
    expect(results[0].name).toBe('Entity 2'); // 新しい順
  });
});
```

### Component テスト

```typescript
// src/presentation/components/__tests__/[Component].test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { [Component] } from '../[Component]';

describe('[Component]', () => {
  it('should render correctly', () => {
    render(<[Component] />);
    
    expect(screen.getByText('Expected Text')).toBeInTheDocument();
  });

  it('should handle user interaction', async () => {
    const mockOnClick = vi.fn();
    render(<[Component] onClick={mockOnClick} />);
    
    const button = screen.getByRole('button');
    fireEvent.click(button);
    
    expect(mockOnClick).toHaveBeenCalledTimes(1);
  });
});
```

## 🔧 ユーティリティテンプレート

### エラーハンドリング

```typescript
// src/shared/utils/error-handling.ts
export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export function handleAsyncError<T>(
  promise: Promise<T>
): Promise<[Error | null, T | null]> {
  return promise
    .then<[null, T]>((data: T) => [null, data])
    .catch<[Error, null]>((error: Error) => [error, null]);
}

// 使用例
const [error, result] = await handleAsyncError(repository.create(data));
if (error) {
  console.error('Operation failed:', error);
  return;
}
// result を安全に使用
```

### 型ガード

```typescript
// src/shared/utils/type-guards.ts
export function isImageAsset(obj: any): obj is ImageAsset {
  return (
    obj &&
    typeof obj.id === 'string' &&
    typeof obj.source === 'string' &&
    typeof obj.width === 'number' &&
    typeof obj.height === 'number'
  );
}

export function isNonNull<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}

// 使用例
const validAssets = assets.filter(isImageAsset);
```

これらのテンプレートを活用して、一貫性のある高品質なコードを効率的に実装してください。
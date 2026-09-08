# API 参考

GB/T 7714 Parser 提供以下主要 API：

| API            | 说明                   |
| :------------- | :--------------------- |
| `parse`        | 解析单条参考文献       |
| `parseAll`     | 批量解析参考文献       |
| `validate`     | 校验文献格式           |
| `format`       | 格式化输出             |
| `parseCitation`| 解析正文引用标注       |
| `formatCitation`| 格式化引用标注        |

## 导入方式

```typescript
// 命名导入
import { parse, format, validate, parseCitation } from 'gb7714-parser';

// 类型导入
import type { ReferenceUnion, Journal, Book } from 'gb7714-parser';
```

## 类型系统

所有文献类型都继承自 `Reference` 基接口：

```typescript
interface Reference {
  type: ReferenceType;
  authors?: Author[];
  title?: string;
  year?: string;
  pid?: string;
  url?: string;
  accessDate?: string;
  mediaType?: MediaType;
  // ... 更多字段
}
```

特定类型的字段通过接口扩展添加：

```typescript
interface Journal extends Reference {
  type: 'J';
  journalTitle?: string;
  volume?: string;
  issue?: string;
  pages?: string;
}

interface Book extends Reference {
  type: 'M';
  publisherPlace?: string;
  publisher?: string;
  version?: string;
  pages?: string;
}
```

## 下一步

- 查看 [parse](/api/parse) 了解解析 API
- 查看 [format](/api/format) 了解格式化 API
- 查看 [validate](/api/validate) 了解校验 API
- 查看 [parseCitation](/api/parse-citation) 了解引用标注解析

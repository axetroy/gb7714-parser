# parseCitation

解析正文中的引用标注。

## 函数签名

```typescript
function parseCitation(citation: string): CitationResult
```

## 参数

### citation

- 类型: `string`
- 必填: 是

要解析的引用标注字符串。

## 返回值

```typescript
interface CitationResult {
  type: 'numeric' | 'author-date';  // 引用类型
  ids?: string[];                    // 编号列表（顺序编码制）
  author?: string;                   // 作者（著者-出版年制）
  year?: string;                     // 年份（著者-出版年制）
  suffix?: string;                   // 后缀（如页码）
}
```

## 示例

### 顺序编码制

```typescript
import { parseCitation } from 'gb7714-parser';

// 单个编号
const result1 = parseCitation('[1]');
console.log(result1.type); // 'numeric'
console.log(result1.ids); // ['1']

// 多个编号
const result2 = parseCitation('[1,2,3]');
console.log(result2.type); // 'numeric'
console.log(result2.ids); // ['1', '2', '3']

// 范围编号
const result3 = parseCitation('[1-5]');
console.log(result3.type); // 'numeric'
console.log(result3.ids); // ['1', '2', '3', '4', '5']
```

### 著者-出版年制

```typescript
// 基本格式
const result4 = parseCitation('(张三, 2025)');
console.log(result4.type); // 'author-date'
console.log(result4.author); // '张三'
console.log(result4.year); // '2025'

// 带后缀
const result5 = parseCitation('(张三, 2025, p. 10)');
console.log(result5.type); // 'author-date'
console.log(result5.author); // '张三'
console.log(result5.year); // '2025'
console.log(result5.suffix); // 'p. 10'
```

### 无法识别的格式

```typescript
const result = parseCitation('unknown format');
console.log(result.type); // 'numeric' (默认)
console.log(result.ids); // ['unknown format']
```

## 使用场景

### 检测引用类型

```typescript
function isNumericCitation(citation: string): boolean {
  const result = parseCitation(citation);
  return result.type === 'numeric';
}

function isAuthorDateCitation(citation: string): boolean {
  const result = parseCitation(citation);
  return result.type === 'author-date';
}
```

### 提取引用编号

```typescript
function extractReferenceIds(citation: string): string[] {
  const result = parseCitation(citation);
  return result.ids || [];
}
```

### 格式化引用标注

```typescript
import { formatCitation } from 'gb7714-parser';

const reference = {
  id: '1',
  type: 'J' as const,
  authors: [{ surname: '张三' }],
  title: '论文标题',
  journalTitle: '期刊名',
  year: '2025',
};

const citation = formatCitation(reference);
console.log(citation); // '[1]'

const authorDateCitation = formatCitation(reference, {
  citationStyle: 'author-date'
});
console.log(authorDateCitation); // '(张三, 2025)'
```

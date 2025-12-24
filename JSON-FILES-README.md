# 📋 JSON файлы в нашем проекте:

## 🔍 Основные Lighthouse отчеты (входные данные):
- `clean-slate-report.json` (1.6MB) - Чистый анализ localhost:3000/en
- `optimized-report.json` (1.6MB) - Анализ после оптимизации  
- `localhost-final-report.json` (1.7MB) - Первый анализ
- `demo-report.json` (1.7MB) - Демо анализ

## 📊 Экспортированные анализы (выходные данные):
- `optimized-full-analysis.json` (987KB) - Полный анализ из нашего парсера

## 🛠️ Как использовать JSON экспорт в ZEUSUS toolkit:

### Создать новый JSON анализ:
```bash
# 1. Создать Lighthouse отчет
npx lighthouse http://localhost:3000 --output=json --save-assets

# 2. Экспортировать полный анализ в JSON
node zeusus/lighthouse-parser.cjs report.json --json --output full-analysis.json
```

### Структура экспортированного JSON:
```json
{
  "metadata": {
    "url": "http://localhost:3000/en",
    "date": "2025-12-24T06:15:16.000Z",
    "lighthouseVersion": "13.0.1"
  },
  "scores": {
    "performance": 87,
    "accessibility": 88,
    "bestPractices": 100,
    "seo": 100
  },
  "coreWebVitals": {
    "LCP": { "value": 3951, "score": 0.51, "status": "poor" },
    "FCP": { "value": 904, "score": 1, "status": "good" },
    "CLS": { "value": 0, "score": 1, "status": "good" },
    "TBT": { "value": 133, "score": 0.96, "status": "good" }
  },
  "criticalErrors": { "console": [], "network": [], "inspector": [] },
  "optimizationOpportunities": [...],
  "allAudits": { ... },
  "devToolsErrors": { ... },
  "longTasks": { ... }
}
```

### Пример использования JSON анализа:
```bash
# Показать размер файла
ls -lh optimized-full-analysis.json

# Посмотреть структуру (первые 50 строк)
head -50 optimized-full-analysis.json | jq .

# Извлечь только scores
cat optimized-full-analysis.json | jq '.scores'

# Найти все performance аудиты
cat optimized-full-analysis.json | jq '.allAudits | to_entries[] | select(.value.category == "performance") | .key'
```

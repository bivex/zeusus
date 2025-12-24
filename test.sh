#!/bin/bash

# 🚀 ZEUSUS Quick Test Script
# Быстрое тестирование всех инструментов анализа

echo "🎯 ZEUSUS Lighthouse Analysis Toolkit - Quick Test"
echo "=================================================="

# Проверяем наличие файлов
echo "📦 Проверка файлов:"
if [ -f "lighthouse-parser.cjs" ]; then
    echo "✅ lighthouse-parser.cjs - найден"
else
    echo "❌ lighthouse-parser.cjs - не найден"
fi

if [ -f "README.md" ]; then
    echo "✅ README.md - найден"
else
    echo "❌ README.md - не найден"
fi

echo ""
echo "🧪 Тестирование функциональности:"
echo "----------------------------------"

# Проверяем help
echo "1. Проверка справки:"
node lighthouse-parser.cjs 2>&1 | head -3

echo ""
echo "2. Проверка анализа существующего отчета:"
if [ -f "clean-slate-report.json" ]; then
    echo "📊 Анализ отчета с чистого листа:"
    node lighthouse-parser.cjs clean-slate-report.json 2>/dev/null | grep -E "(📊|📈|✅|🎯)" | head -5
else
    echo "⚠️  clean-slate-report.json не найден для тестирования"
fi

echo ""
echo "3. Проверка Markdown вывода:"
if [ -f "clean-slate-report.json" ]; then
    echo "📝 Создание Markdown отчета:"
    node lighthouse-parser.cjs clean-slate-report.json --markdown --output test-report.md 2>/dev/null && echo "✅ Markdown отчет создан: test-report.md" || echo "❌ Ошибка создания Markdown"
else
    echo "⚠️  Отчет для тестирования не найден"
fi

echo ""
echo "4. Проверка категоризации:"
if [ -f "clean-slate-report.json" ]; then
    echo "🏷️  Performance аудиты:"
    node lighthouse-parser.cjs clean-slate-report.json --category performance 2>/dev/null | head -3
else
    echo "⚠️  Отчет для тестирования не найден"
fi

echo ""
echo "🎉 Тестирование завершено!"
echo ""
echo "📚 Для полного использования читайте README.md"
echo "🚀 Для быстрого старта: node lighthouse-parser.cjs <report.json>"

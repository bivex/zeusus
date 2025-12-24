#!/usr/bin/env node
/**
 * Copyright (c) 2025 Bivex
 *
 * Author: Bivex
 * Available for contact via email: support@b-b.top
 * For up-to-date contact information:
 * https://github.com/bivex
 *
 * Created: 2025-12-24T04:03:36
 * Last Updated: 2025-12-24T06:03:29
 *
 * Licensed under the MIT License.
 * Commercial licensing available upon request.
 */

/**
 * Lighthouse JSON Parser - извлекает самые важные данные
 * Использует приоритеты анализа от пользователя
 */

const fs = require('fs');
const path = require('path');

class LighthouseParser {
  constructor(reportPath) {
    this.reportPath = reportPath;
    this.report = null;
    this.devtoolsLog = null;
    this.traceData = null;
  }

  loadReport() {
    try {
      this.report = JSON.parse(fs.readFileSync(this.reportPath, 'utf8'));
      return true;
    } catch (error) {
      console.error('❌ Ошибка загрузки отчета:', error.message);
      return false;
    }
  }

  loadDevToolsLog() {
    const logPath = this.reportPath.replace('.json', '-0.devtoolslog.json');
    if (fs.existsSync(logPath)) {
      try {
        // DevTools log - массив JSON объектов
        const logContent = fs.readFileSync(logPath, 'utf8');
        this.devtoolsLog = logContent.trim().split('\n').map(line => {
          try {
            return JSON.parse(line);
          } catch {
            return null;
          }
        }).filter(Boolean);
        return true;
      } catch (error) {
        console.error('❌ Ошибка загрузки DevTools log:', error.message);
      }
    }
    return false;
  }

  loadTraceData() {
    const tracePath = this.reportPath.replace('.json', '-0.trace.json');
    if (fs.existsSync(tracePath)) {
      try {
        this.traceData = JSON.parse(fs.readFileSync(tracePath, 'utf8'));
        return true;
      } catch (error) {
        console.error('❌ Ошибка загрузки trace данных:', error.message);
      }
    }
    return false;
  }

  // Priority 1: Core Web Vitals
  getCoreWebVitals() {
    if (!this.report?.audits) return null;

    return {
      'Largest Contentful Paint (LCP)': {
        value: this.report.audits['largest-contentful-paint']?.numericValue || 0,
        unit: 'ms',
        score: this.report.audits['largest-contentful-paint']?.score || 0,
        status: this.getMetricStatus('largest-contentful-paint')
      },
      'First Contentful Paint (FCP)': {
        value: this.report.audits['first-contentful-paint']?.numericValue || 0,
        unit: 'ms',
        score: this.report.audits['first-contentful-paint']?.score || 0,
        status: this.getMetricStatus('first-contentful-paint')
      },
      'Cumulative Layout Shift (CLS)': {
        value: this.report.audits['cumulative-layout-shift']?.numericValue || 0,
        unit: 'score',
        score: this.report.audits['cumulative-layout-shift']?.score || 0,
        status: this.getMetricStatus('cumulative-layout-shift')
      },
      'Total Blocking Time (TBT)': {
        value: this.report.audits['total-blocking-time']?.numericValue || 0,
        unit: 'ms',
        score: this.report.audits['total-blocking-time']?.score || 0,
        status: this.getMetricStatus('total-blocking-time')
      }
    };
  }

  getMetricStatus(auditId) {
    const audit = this.report.audits[auditId];
    if (!audit) return 'unknown';

    if (audit.score === 1) return 'good';
    if (audit.score === 0) return 'poor';
    if (audit.score > 0 && audit.score < 1) return 'needs-improvement';
    return 'unknown';
  }

  // Priority 2: Критические ошибки
  getCriticalErrors() {
    if (!this.report?.audits) return null;

    const errors = {
      console: [],
      network: [],
      inspector: []
    };

    // Console errors
    const consoleErrors = this.report.audits['errors-in-console'];
    if (consoleErrors?.details?.items) {
      errors.console = consoleErrors.details.items.map(item => ({
        description: item.description,
        source: item.source,
        url: item.url,
        line: item.lineNumber,
        column: item.columnNumber
      }));
    }

    // Network errors
    const networkRequests = this.report.audits['network-requests'];
    if (networkRequests?.details?.items) {
      errors.network = networkRequests.details.items
        .filter(req => req.statusCode && req.statusCode >= 400)
        .map(req => ({
          url: req.url,
          status: req.statusCode,
          resourceType: req.resourceType,
          transferSize: req.transferSize
        }));
    }

    // Inspector issues
    const inspectorIssues = this.report.audits['inspector-issues'];
    if (inspectorIssues?.details?.items) {
      errors.inspector = inspectorIssues.details.items.map(item => ({
        code: item.code,
        title: item.title,
        description: item.description,
        severity: item.severity
      }));
    }

    return errors;
  }

  // Priority 3: Возможности оптимизации
  getOptimizationOpportunities() {
    if (!this.report?.audits) return null;

    const opportunities = [];

    // Performance opportunities - самые важные для оптимизации
    const perfOpportunities = [
      'render-blocking-resources',
      'unused-javascript',
      'unminified-javascript',
      'unused-css-rules',
      'modern-image-formats',
      'uses-optimized-images',
      'offscreen-images',
      'uses-responsive-images',
      'efficient-animated-content',
      'duplicated-javascript',
      'legacy-javascript'
    ];

    // Проходим по всем аудитам и ищем opportunities
    Object.entries(this.report.audits).forEach(([key, audit]) => {
      if (audit.details?.overallSavingsMs > 0 || audit.details?.overallSavingsBytes > 0) {
        opportunities.push({
          audit: key,
          title: audit.title,
          score: audit.score,
          savingsMs: audit.details.overallSavingsMs || 0,
          savingsBytes: audit.details.overallSavingsBytes || 0,
          displayValue: audit.displayValue,
          description: audit.description,
          category: this.getAuditCategory(key),
          priority: perfOpportunities.includes(key) ? 'high' : 'medium'
        });
      }
    });

    // Сортируем по потенциалу экономии (ms + bytes/1000 для сравнения)
    return opportunities.sort((a, b) => {
      const aSavings = a.savingsMs + (a.savingsBytes / 1000);
      const bSavings = b.savingsMs + (b.savingsBytes / 1000);
      return bSavings - aSavings;
    });
  }

  // Определяем категорию аудита
  getAuditCategory(auditId) {
    // Performance audits
    const perfAudits = [
      'first-contentful-paint', 'largest-contentful-paint', 'speed-index',
      'total-blocking-time', 'max-potential-fid', 'cumulative-layout-shift',
      'interactive', 'server-response-time', 'redirects', 'uses-rel-preconnect',
      'uses-rel-preload', 'font-display', 'diagnostics', 'network-requests',
      'network-rtt', 'network-server-latency', 'main-thread-tasks', 'bootup-time',
      'uses-long-cache-ttl', 'total-byte-weight', 'dom-size', 'critical-request-chains',
      'user-timings', 'metrics', 'screenshot-thumbnails', 'final-screenshot',
      'resource-summary', 'third-party-summary', 'third-party-facades',
      'largest-contentful-paint-element', 'lcp-lazy-loaded', 'layout-shift-elements',
      'long-tasks', 'non-composited-animations', 'unsized-images',
      'preload-lcp-image', 'full-page-screenshot', 'script-treemap-data',
      'prioritize-lcp-image', 'render-blocking-resources', 'uses-responsive-images',
      'offscreen-images', 'unminified-css', 'unminified-javascript',
      'unused-css-rules', 'unused-javascript', 'modern-image-formats',
      'uses-optimized-images', 'uses-text-compression', 'uses-responsive-images-snapshot',
      'efficient-animated-content', 'duplicated-javascript', 'legacy-javascript',
      'prioritize-lcp-image', 'viewport', 'layout-shift-culprits', 'document-latency',
      'optimize-dom-size', 'duplicated-javascript-insight', 'font-display-insight',
      'forced-reflow', 'image-delivery', 'inp-breakdown', 'lcp-breakdown',
      'lcp-discovery', 'legacy-javascript-insight', 'modern-http',
      'network-dependency-tree', 'render-blocking-insight', 'slow-css-selector',
      'third-parties-insight', 'viewport-mobile'
    ];

    // Accessibility audits
    const a11yAudits = [
      'accesskeys', 'aria-allowed-attr', 'aria-allowed-role', 'aria-command-name',
      'aria-dialog-name', 'aria-hidden-body', 'aria-hidden-focus', 'aria-input-field-name',
      'aria-meter-name', 'aria-progressbar-name', 'aria-prohibited-attr', 'aria-required-attr',
      'aria-required-children', 'aria-required-parent', 'aria-roles', 'aria-text',
      'aria-toggle-field-name', 'aria-tooltip-name', 'aria-treeitem-name',
      'aria-valid-attr-value', 'aria-valid-attr', 'button-name', 'bypass', 'color-contrast',
      'definition-list', 'dlitem', 'document-title', 'duplicate-id-active', 'duplicate-id-aria',
      'empty-heading', 'form-field-multiple-labels', 'frame-title', 'heading-order',
      'html-has-lang', 'html-lang-valid', 'html-xml-lang-mismatch', 'identical-links-same-purpose',
      'image-alt', 'image-redundant-alt', 'input-button-name', 'input-image-alt',
      'label-content-name-mismatch', 'label', 'landmark-one-main', 'link-name',
      'link-in-text-block', 'list', 'listitem', 'meta-refresh', 'meta-viewport', 'object-alt',
      'select-name', 'skip-link', 'tabindex', 'table-duplicate-name', 'table-fake-caption',
      'target-size', 'td-has-header', 'td-headers-attr', 'th-has-data-cells', 'valid-lang',
      'video-caption', 'custom-controls-labels', 'custom-controls-roles', 'focus-traps',
      'focusable-controls', 'interactive-element-affordance', 'logical-tab-order',
      'managed-focus', 'offscreen-content-hidden', 'use-landmarks', 'visual-order-follows-dom'
    ];

    // Best Practices audits
    const bpAudits = [
      'is-on-https', 'redirects-http', 'geolocation-on-start', 'notification-on-start',
      'no-document-write', 'no-vulnerable-libraries', 'js-libraries', 'deprecations',
      'third-party-cookies', 'errors-in-console', 'image-aspect-ratio', 'image-size-responsive',
      'doctype', 'charset', 'no-unload-listeners', 'paste-preventing-inputs', 'inspector-issues',
      'csp-xss', 'hsts', 'coop-coep', 'xfo', 'trusted-types'
    ];

    // SEO audits
    const seoAudits = [
      'viewport', 'document-title', 'meta-description', 'http-status-code', 'link-text',
      'crawlable-anchors', 'is-crawlable', 'robots-txt', 'hreflang', 'canonical',
      'font-size', 'plugins', 'tap-targets', 'structured-data'
    ];

    // PWA audits
    const pwaAudits = [
      'installable-manifest', 'splash-screen', 'themed-omnibox', 'content-width',
      'viewport', 'apple-touch-icon', 'service-worker', 'offline-start-url',
      'without-javascript', 'maskable-icon'
    ];

    if (perfAudits.includes(auditId)) return 'performance';
    if (a11yAudits.includes(auditId)) return 'accessibility';
    if (bpAudits.includes(auditId)) return 'best-practices';
    if (seoAudits.includes(auditId)) return 'seo';
    if (pwaAudits.includes(auditId)) return 'pwa';

    return 'other';
  }

  // Анализ DevTools Log для ошибок
  getDevToolsErrors() {
    if (!this.devtoolsLog) return null;

    const errors = {
      console: [],
      exceptions: [],
      networkFails: []
    };

    this.devtoolsLog.forEach(entry => {
      // Console API calls
      if (entry.method === 'Runtime.consoleAPICalled') {
        if (entry.params.type === 'error') {
          errors.console.push({
            message: entry.params.args?.[0]?.value || 'Unknown error',
            timestamp: entry.params.timestamp,
            stackTrace: entry.params.stackTrace
          });
        }
      }

      // JavaScript exceptions
      if (entry.method === 'Runtime.exceptionThrown') {
        errors.exceptions.push({
          exception: entry.params.exceptionDetails,
          timestamp: entry.params.timestamp
        });
      }

      // Network failures
      if (entry.method === 'Network.loadingFailed') {
        errors.networkFails.push({
          url: entry.params.request?.url,
          errorText: entry.params.errorText,
          timestamp: entry.params.timestamp
        });
      }
    });

    return errors;
  }

  // Анализ Trace для Long Tasks
  getLongTasks() {
    if (!this.traceData?.traceEvents) return null;

    const longTasks = this.traceData.traceEvents
      .filter(event =>
        event.cat?.includes('devtools.timeline') &&
        event.name === 'RunTask' &&
        event.dur > 50000 // > 50ms
      )
      .map(event => ({
        duration: event.dur / 1000, // в ms
        startTime: event.ts / 1000, // в ms
        thread: event.tid
      }))
      .sort((a, b) => b.duration - a.duration);

    return {
      count: longTasks.length,
      totalDuration: longTasks.reduce((sum, task) => sum + task.duration, 0),
      longestTask: longTasks[0]?.duration || 0,
      tasks: longTasks.slice(0, 5) // top 5
    };
  }

  // Основной метод анализа с выводом в консоль
  analyze() {
    console.log('🔍 Lighthouse Parser - анализ отчета\n');

    if (!this.loadReport()) {
      return;
    }

    // Загружаем дополнительные данные
    this.loadDevToolsLog();
    this.loadTraceData();

    // 1. Core Web Vitals
    const coreWebVitals = this.getCoreWebVitals();
    if (coreWebVitals) {
      console.log('📊 Core Web Vitals:');
      Object.entries(coreWebVitals).forEach(([name, data]) => {
        const status = data.status === 'good' ? '🟢' : data.status === 'poor' ? '🔴' : '🟡';
        console.log(`  ${status} ${name}: ${data.value}${data.unit} (score: ${data.score})`);
      });
      console.log();
    }

    // 2. Критические ошибки
    const criticalErrors = this.getCriticalErrors();
    if (criticalErrors) {
      const totalErrors = criticalErrors.console.length + criticalErrors.network.length + criticalErrors.inspector.length;
      if (totalErrors > 0) {
        console.log('🚨 Критические ошибки:');
        if (criticalErrors.console.length > 0) {
          console.log(`  🔴 Console errors: ${criticalErrors.console.length}`);
          criticalErrors.console.slice(0, 3).forEach(err => {
            console.log(`    - ${err.description}`);
          });
        }
        if (criticalErrors.network.length > 0) {
          console.log(`  🔴 Network errors: ${criticalErrors.network.length}`);
          criticalErrors.network.slice(0, 3).forEach(err => {
            console.log(`    - ${err.status} ${err.url}`);
          });
        }
        if (criticalErrors.inspector.length > 0) {
          console.log(`  🔴 Inspector issues: ${criticalErrors.inspector.length}`);
          criticalErrors.inspector.slice(0, 3).forEach(issue => {
            console.log(`    - ${issue.title}`);
          });
        }
        console.log();
      } else {
        console.log('✅ Критических ошибок не найдено\n');
      }
    }

    // 3. DevTools errors (дополнительно)
    const devToolsErrorsData = this.getDevToolsErrors();
    if (devToolsErrorsData && (devToolsErrorsData.console.length > 0 || devToolsErrorsData.exceptions.length > 0)) {
      console.log('🛠️ DevTools Errors:');
      console.log(`  Console: ${devToolsErrorsData.console.length}, Exceptions: ${devToolsErrorsData.exceptions.length}`);
      console.log();
    }

    // 4. Long Tasks
    const longTasksData = this.getLongTasks();
    if (longTasksData && longTasksData.count > 0) {
      console.log('⏱️ Long Tasks:');
      console.log(`  Count: ${longTasksData.count}, Total duration: ${Math.round(longTasksData.totalDuration)}ms`);
      console.log(`  Longest: ${Math.round(longTasksData.longestTask)}ms`);
      console.log();
    }

    // 5. Top optimization opportunities
    const optimizationOpportunities = this.getOptimizationOpportunities();
    if (optimizationOpportunities && optimizationOpportunities.length > 0) {
      console.log('🎯 Top оптимизации:');
      optimizationOpportunities.slice(0, 5).forEach((opp, index) => {
        const savings = opp.savingsMs > 0 ? `${opp.savingsMs}ms` :
                       opp.savingsBytes > 0 ? `${Math.round(opp.savingsBytes/1024)}KB` : '';
        console.log(`  ${index + 1}. ${opp.title} - экономия: ${savings}`);
      });
      console.log();
    }

    // 6. Общий скор
    if (this.report.categories) {
      console.log('📈 Общие оценки:');
      Object.values(this.report.categories).forEach(category => {
        const score = Math.round(category.score * 100);
        const status = score >= 90 ? '🟢' : score >= 75 ? '🟢' : score >= 50 ? '🟡' : '🔴';
        console.log(`  ${status} ${category.title}: ${score}/100`);
      });
      console.log();
    }

    // 7. Детальный анализ по категориям
    this.printCategoryDetails();

    console.log('✅ Анализ завершен!');
  }

  // Детальный анализ по категориям
  printCategoryDetails() {
    if (!this.report?.audits) return;

    console.log('📋 Детальный анализ по категориям:\n');

    // Performance details
    if (this.report.categories?.performance) {
      console.log('⚡ Performance:');
      const perfAudits = this.getAuditsByCategory('performance');
      const failedAudits = perfAudits.filter(a => a.score < 0.9).slice(0, 3);
      if (failedAudits.length > 0) {
        failedAudits.forEach(audit => {
          console.log(`  🔴 ${audit.title}: ${Math.round(audit.score * 100)}%`);
        });
      } else {
        console.log('  ✅ Все ключевые метрики в порядке');
      }
      console.log();
    }

    // Accessibility details
    if (this.report.categories?.accessibility) {
      console.log('♿ Accessibility:');
      const a11yAudits = this.getAuditsByCategory('accessibility');
      const failedAudits = a11yAudits.filter(a => a.score < 1).slice(0, 3);
      if (failedAudits.length > 0) {
        console.log(`  🔴 ${failedAudits.length} проблем с доступностью`);
      } else {
        console.log('  ✅ Нет проблем с доступностью');
      }
      console.log();
    }

    // Best Practices details
    if (this.report.categories?.['best-practices']) {
      console.log('✨ Best Practices:');
      const bpAudits = this.getAuditsByCategory('best-practices');
      const failedAudits = bpAudits.filter(a => a.score < 1);
      if (failedAudits.length > 0) {
        console.log(`  🔴 ${failedAudits.length} нарушений лучших практик`);
      } else {
        console.log('  ✅ Соблюдены все лучшие практики');
      }
      console.log();
    }

    // SEO details
    if (this.report.categories?.seo) {
      console.log('🔍 SEO:');
      const seoAudits = this.getAuditsByCategory('seo');
      const failedAudits = seoAudits.filter(a => a.score < 1).slice(0, 3);
      if (failedAudits.length > 0) {
        failedAudits.forEach(audit => {
          console.log(`  🔴 ${audit.title}: ${Math.round(audit.score * 100)}%`);
        });
      } else {
        console.log('  ✅ Оптимизировано для поисковых систем');
      }
      console.log();
    }

    // PWA details
    if (this.report.categories?.pwa) {
      console.log('📱 PWA:');
      const pwaScore = Math.round(this.report.categories.pwa.score * 100);
      if (pwaScore >= 80) {
        console.log('  ✅ Хорошо оптимизировано для PWA');
      } else if (pwaScore >= 50) {
        console.log(`  🟡 ${pwaScore}/100 - можно улучшить`);
      } else {
        console.log(`  🔴 ${pwaScore}/100 - требуется оптимизация`);
      }
      console.log();
    }
  }

  // Получить аудиты по категории
  getAuditsByCategory(category) {
    if (!this.report?.audits) return [];

    return Object.entries(this.report.audits)
      .filter(([key]) => this.getAuditCategory(key) === category)
      .map(([key, audit]) => ({
        id: key,
        title: audit.title,
        score: audit.score,
        displayValue: audit.displayValue
      }));
  }

  // Получить все аудиты с полной информацией
  getAllAudits() {
    if (!this.report?.audits) return {};

    const audits = {};
    Object.entries(this.report.audits).forEach(([key, audit]) => {
      audits[key] = {
        id: key,
        title: audit.title,
        description: audit.description,
        score: audit.score,
        numericValue: audit.numericValue,
        displayValue: audit.displayValue,
        category: this.getAuditCategory(key),
        details: audit.details
      };
    });
    return audits;
  }

  // Экспорт полного анализа в JSON
  exportFullAnalysis() {
    return {
      metadata: {
        url: this.report.finalDisplayedUrl,
        date: new Date(this.report.fetchTime || Date.now()).toISOString(),
        lighthouseVersion: this.report.lighthouseVersion
      },
      scores: this.getAllCategoryScores(),
      coreWebVitals: this.getCoreWebVitals(),
      criticalErrors: this.getCriticalErrors(),
      optimizationOpportunities: this.getOptimizationOpportunities(),
      allAudits: this.getAllAudits(),
      devToolsErrors: this.getDevToolsErrors(),
      longTasks: this.getLongTasks()
    };
  }

  // Получить все оценки категорий
  getAllCategoryScores() {
    if (!this.report?.categories) return {};

    const scores = {};
    Object.entries(this.report.categories).forEach(([key, category]) => {
      scores[key] = {
        title: category.title,
        score: Math.round(category.score * 100),
        rawScore: category.score,
        description: category.description
      };
    });
    return scores;
  }

  // Метод для генерации Markdown отчета
  generateMarkdownReport() {
    if (!this.loadReport()) {
      return '# ❌ Ошибка загрузки отчета\n\nНе удалось загрузить Lighthouse отчет.';
    }

    // Загружаем дополнительные данные
    this.loadDevToolsLog();
    this.loadTraceData();

    let markdown = [];

    // Header
    markdown.push('# 📊 Lighthouse Parser Report');
    markdown.push('');
    markdown.push(`**URL:** ${this.report.finalDisplayedUrl || 'Unknown'}`);
    markdown.push(`**Date:** ${new Date(this.report.fetchTime || Date.now()).toLocaleString()}`);
    markdown.push(`**Lighthouse Version:** ${this.report.lighthouseVersion || 'Unknown'}`);
    markdown.push('');

    // Core Web Vitals
    const metrics = this.getCoreWebVitals();
    if (metrics) {
      markdown.push('## 📊 Core Web Vitals');
      markdown.push('');
      markdown.push('| Metric | Value | Score | Status |');
      markdown.push('|--------|-------|-------|--------|');

      Object.entries(metrics).forEach(([name, data]) => {
        const status = data.status === 'good' ? '🟢 Good' :
                      data.status === 'poor' ? '🔴 Poor' : '🟡 Needs Work';
        markdown.push(`| ${name} | ${data.value}${data.unit} | ${Math.round(data.score * 100)}% | ${status} |`);
      });
      markdown.push('');
    }

    // Critical Errors
    const errors = this.getCriticalErrors();
    if (errors) {
      const totalErrors = errors.console.length + errors.network.length + errors.inspector.length;

      if (totalErrors > 0) {
        markdown.push('## 🚨 Critical Errors');
        markdown.push('');
        markdown.push(`**Total Errors:** ${totalErrors}`);
        markdown.push('');

        if (errors.console.length > 0) {
          markdown.push('### Console Errors');
          markdown.push('');
          errors.console.slice(0, 5).forEach(err => {
            markdown.push(`- **${err.description}**`);
            if (err.url) markdown.push(`  - URL: ${err.url}`);
            if (err.line) markdown.push(`  - Line: ${err.line}`);
          });
          markdown.push('');
        }

        if (errors.network.length > 0) {
          markdown.push('### Network Errors');
          markdown.push('');
          errors.network.slice(0, 5).forEach(err => {
            markdown.push(`- **${err.status}** ${err.url}`);
          });
          markdown.push('');
        }

        if (errors.inspector.length > 0) {
          markdown.push('### Inspector Issues');
          markdown.push('');
          errors.inspector.slice(0, 5).forEach(issue => {
            markdown.push(`- **${issue.title}** (${issue.severity})`);
            if (issue.description) markdown.push(`  - ${issue.description}`);
          });
          markdown.push('');
        }
      } else {
        markdown.push('## ✅ No Critical Errors Found');
        markdown.push('');
        markdown.push('Great! No console errors, network failures, or inspector issues detected.');
        markdown.push('');
      }
    }

    // Long Tasks
    const longTasks = this.getLongTasks();
    if (longTasks && longTasks.count > 0) {
      markdown.push('## ⏱️ Long Tasks Analysis');
      markdown.push('');
      markdown.push(`- **Total Long Tasks:** ${longTasks.count}`);
      markdown.push(`- **Total Duration:** ${Math.round(longTasks.totalDuration)}ms`);
      markdown.push(`- **Longest Task:** ${Math.round(longTasks.longestTask)}ms`);
      markdown.push('');
      markdown.push('Long tasks (>50ms) can cause responsiveness issues.');
      markdown.push('');
    }

    // Top Optimization Opportunities
    const opportunities = this.getOptimizationOpportunities();
    if (opportunities && opportunities.length > 0) {
      markdown.push('## 🎯 Top Optimization Opportunities');
      markdown.push('');
      markdown.push('| Rank | Audit | Potential Savings |');
      markdown.push('|------|-------|-------------------|');

      opportunities.slice(0, 10).forEach((opp, index) => {
        const savings = opp.savingsMs > 0 ? `${opp.savingsMs}ms` :
                       opp.savingsBytes > 0 ? `${Math.round(opp.savingsBytes/1024)}KB` : 'N/A';
        markdown.push(`| ${index + 1} | ${opp.title} | ${savings} |`);
      });
      markdown.push('');

      // Detailed recommendations for top opportunities
      opportunities.slice(0, 3).forEach((opp, index) => {
        markdown.push(`### ${index + 1}. ${opp.title}`);
        markdown.push('');
        if (opp.description) {
          markdown.push(opp.description);
          markdown.push('');
        }
        if (opp.displayValue) {
          markdown.push(`**Impact:** ${opp.displayValue}`);
          markdown.push('');
        }
      });
    }

    // Overall Scores
    if (this.report.categories) {
      markdown.push('## 📈 Overall Scores');
      markdown.push('');
      markdown.push('| Category | Score | Status | Description |');
      markdown.push('|----------|-------|--------|-------------|');

      Object.entries(this.report.categories).forEach(([key, category]) => {
        const score = Math.round(category.score * 100);
        const status = score >= 90 ? '🟢 Excellent' :
                      score >= 75 ? '🟢 Good' :
                      score >= 50 ? '🟡 Needs Work' : '🔴 Poor';

        let description = '';
        switch(key) {
          case 'performance':
            description = score >= 90 ? 'Excellent performance' :
                         score >= 50 ? 'Good performance' : 'Needs optimization';
            break;
          case 'accessibility':
            description = score >= 90 ? 'Highly accessible' :
                         score >= 50 ? 'Good accessibility' : 'Accessibility issues';
            break;
          case 'best-practices':
            description = score >= 90 ? 'Follows best practices' :
                         score >= 50 ? 'Good practices' : 'Practice violations';
            break;
          case 'seo':
            description = score >= 90 ? 'SEO optimized' :
                         score >= 50 ? 'Good SEO' : 'SEO issues';
            break;
          case 'pwa':
            description = score >= 80 ? 'PWA ready' :
                         score >= 50 ? 'Partial PWA' : 'Not PWA optimized';
            break;
        }

        markdown.push(`| ${category.title} | ${score}/100 | ${status} | ${description} |`);
      });
      markdown.push('');
    }

    // Detailed Category Analysis
    this.addCategoryDetailsToMarkdown(markdown);

    // Recommendations
    markdown.push('## 💡 Recommendations');
    markdown.push('');

    const webVitals = this.getCoreWebVitals();
    const errorsData = this.getCriticalErrors();
    const opportunitiesData = this.getOptimizationOpportunities();

    if (errorsData && (errorsData.console.length + errorsData.network.length + errorsData.inspector.length) > 0) {
      markdown.push('### 🔴 Priority 1: Fix Critical Errors');
      markdown.push('Address all console errors, network failures, and inspector issues before optimizing performance.');
      markdown.push('');
    }

    if (webVitals) {
      const poorMetrics = Object.values(webVitals).filter(m => m.status === 'poor');
      if (poorMetrics.length > 0) {
        markdown.push('### 🟡 Priority 2: Improve Core Web Vitals');
        poorMetrics.forEach(metric => {
          const name = Object.keys(webVitals).find(key => webVitals[key] === metric);
          markdown.push(`- Optimize **${name}** (currently ${metric.value}${metric.unit})`);
        });
        markdown.push('');
      }
    }

    if (opportunitiesData && opportunitiesData.length > 0) {
      markdown.push('### 🟢 Priority 3: Apply Performance Optimizations');
      markdown.push('Focus on high-impact optimizations with the largest potential savings:');
      opportunitiesData.slice(0, 3).forEach((opp, index) => {
        const savings = opp.savingsMs > 0 ? `${opp.savingsMs}ms` :
                       opp.savingsBytes > 0 ? `${Math.round(opp.savingsBytes/1024)}KB` : '';
        markdown.push(`${index + 1}. ${opp.title} (${savings} savings)`);
      });
      markdown.push('');
    }

    markdown.push('---');
    markdown.push('');
    markdown.push('*Report generated by Lighthouse Parser*');

    return markdown.join('\n');
  }

  // Добавить детальный анализ категорий в Markdown
  addCategoryDetailsToMarkdown(markdown) {
    if (!this.report?.audits) return;

    markdown.push('## 📋 Detailed Category Analysis');
    markdown.push('');

    // Performance details
    if (this.report.categories?.performance) {
      markdown.push('### ⚡ Performance Details');
      markdown.push('');
      const perfAudits = this.getAuditsByCategory('performance');
      const failedAudits = perfAudits.filter(a => a.score < 0.9).slice(0, 5);

      if (failedAudits.length > 0) {
        markdown.push('| Audit | Score | Issue |');
        markdown.push('|-------|-------|-------|');
        failedAudits.forEach(audit => {
          const score = Math.round(audit.score * 100);
          markdown.push(`| ${audit.title} | ${score}% | Needs attention |`);
        });
      } else {
        markdown.push('✅ All key performance metrics are optimized.');
      }
      markdown.push('');
    }

    // Accessibility details
    if (this.report.categories?.accessibility) {
      markdown.push('### ♿ Accessibility Details');
      markdown.push('');
      const a11yAudits = this.getAuditsByCategory('accessibility');
      const failedAudits = a11yAudits.filter(a => a.score < 1).slice(0, 5);

      if (failedAudits.length > 0) {
        markdown.push(`**Issues found:** ${failedAudits.length}`);
        markdown.push('');
        markdown.push('| Audit | Status |');
        markdown.push('|-------|--------|');
        failedAudits.forEach(audit => {
          markdown.push(`| ${audit.title} | ❌ Failed |`);
        });
      } else {
        markdown.push('✅ No accessibility issues found.');
      }
      markdown.push('');
    }

    // Best Practices details
    if (this.report.categories?.['best-practices']) {
      markdown.push('### ✨ Best Practices Details');
      markdown.push('');
      const bpAudits = this.getAuditsByCategory('best-practices');
      const failedAudits = bpAudits.filter(a => a.score < 1);

      if (failedAudits.length > 0) {
        markdown.push(`**Violations:** ${failedAudits.length}`);
        markdown.push('');
        failedAudits.slice(0, 5).forEach(audit => {
          markdown.push(`- ❌ ${audit.title}`);
        });
      } else {
        markdown.push('✅ All best practices are followed.');
      }
      markdown.push('');
    }

    // SEO details
    if (this.report.categories?.seo) {
      markdown.push('### 🔍 SEO Details');
      markdown.push('');
      const seoAudits = this.getAuditsByCategory('seo');
      const failedAudits = seoAudits.filter(a => a.score < 1).slice(0, 5);

      if (failedAudits.length > 0) {
        markdown.push('| SEO Audit | Status |');
        markdown.push('|-----------|--------|');
        failedAudits.forEach(audit => {
          markdown.push(`| ${audit.title} | ❌ Needs work |`);
        });
      } else {
        markdown.push('✅ Well optimized for search engines.');
      }
      markdown.push('');
    }

    // PWA details
    if (this.report.categories?.pwa) {
      markdown.push('### 📱 PWA Details');
      markdown.push('');
      const pwaScore = Math.round(this.report.categories.pwa.score * 100);
      const pwaAudits = this.getAuditsByCategory('pwa');
      const failedAudits = pwaAudits.filter(a => a.score < 1);

      markdown.push(`**PWA Score:** ${pwaScore}/100`);
      markdown.push('');

      if (failedAudits.length > 0) {
        markdown.push('**Missing PWA features:**');
        failedAudits.forEach(audit => {
          markdown.push(`- ❌ ${audit.title}`);
        });
      } else {
        markdown.push('✅ Fully PWA compliant.');
      }
      markdown.push('');
    }
  }
}

module.exports = LighthouseParser;
module.exports = LighthouseParser;

// CLI интерфейс
(function() {
  const args = process.argv.slice(2);

if (args.length === 0) {
  console.log('Использование: node lighthouse-parser.js <report.json> [options]');
  console.log('');
  console.log('Опции:');
  console.log('  --markdown              # Markdown вывод');
  console.log('  --output <file>         # Сохранить в файл');
  console.log('  --json                  # Экспорт полного анализа в JSON');
  console.log('  --all-audits            # Показать все аудиты');
  console.log('  --category <name>       # Показать аудиты категории (performance, accessibility, etc.)');
  console.log('');
  console.log('Примеры:');
  console.log('  node lighthouse-parser.js report.json                           # Базовый анализ');
  console.log('  node lighthouse-parser.js report.json --markdown --output report.md');
  console.log('  node lighthouse-parser.js report.json --json --output analysis.json');
  console.log('  node lighthouse-parser.js report.json --category performance');
  process.exit(1);
}

  const reportPath = args[0];
  const parser = new LighthouseParser(reportPath);

  // Parse arguments
  const markdownFlag = args.includes('--markdown');
  const jsonFlag = args.includes('--json');
  const allAuditsFlag = args.includes('--all-audits');
  const categoryIndex = args.indexOf('--category');
  const categoryName = categoryIndex !== -1 && args[categoryIndex + 1] ? args[categoryIndex + 1] : null;
  const outputIndex = args.indexOf('--output');
  const outputPath = outputIndex !== -1 && args[outputIndex + 1] ? args[outputIndex + 1] : null;

  if (jsonFlag) {
    // Export full analysis as JSON
    parser.loadReport();
    parser.loadDevToolsLog();
    parser.loadTraceData();
    const analysis = parser.exportFullAnalysis();
    const jsonOutput = JSON.stringify(analysis, null, 2);

    if (outputPath) {
      const fs = require('fs');
      const path = require('path');

      const dir = path.dirname(outputPath);
      if (dir !== '.' && !fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      fs.writeFileSync(outputPath, jsonOutput, 'utf8');
      console.log(`✅ Полный анализ экспортирован в: ${outputPath}`);
    } else {
      console.log(jsonOutput);
    }
    return; // Exit here
  } else if (categoryName) {
    // Show audits for specific category
    parser.loadReport();
    const categoryAudits = parser.getAuditsByCategory(categoryName);
    if (categoryAudits.length > 0) {
      console.log(`🔍 Аудиты категории "${categoryName.toUpperCase()}":\n`);
      categoryAudits.forEach(audit => {
        const score = Math.round(audit.score * 100);
        const status = audit.score === 1 ? '✅' : audit.score >= 0.9 ? '🟢' : audit.score >= 0.5 ? '🟡' : '🔴';
        console.log(`${status} ${audit.title}: ${score}%`);
        if (audit.displayValue) {
          console.log(`   ${audit.displayValue}`);
        }
      });
    } else {
      console.log(`❌ Категория "${categoryName}" не найдена или не имеет аудитов`);
    }
    return; // Exit here, don't call analyze()
  } else if (allAuditsFlag) {
    // Show all audits
    parser.loadReport();
    const audits = parser.getAllAudits();
    console.log('🔍 Все аудиты Lighthouse:\n');

    const categories = ['performance', 'accessibility', 'best-practices', 'seo', 'pwa', 'other'];
    categories.forEach(cat => {
      const categoryAudits = Object.values(audits).filter(a => a.category === cat);
      if (categoryAudits.length > 0) {
        console.log(`${cat.toUpperCase()}:`);
        categoryAudits.forEach(audit => {
          const score = Math.round(audit.score * 100);
          const status = audit.score === 1 ? '✅' : audit.score >= 0.9 ? '🟢' : audit.score >= 0.5 ? '🟡' : '🔴';
          console.log(`  ${status} ${audit.title}: ${score}%`);
        });
        console.log();
      }
    });
    return; // Exit here, don't call analyze()
  } else if (markdownFlag) {
    // Generate Markdown report
    const markdownReport = parser.generateMarkdownReport();

    if (outputPath) {
      const fs = require('fs');
      const path = require('path');

      const dir = path.dirname(outputPath);
      if (dir !== '.' && !fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      fs.writeFileSync(outputPath, markdownReport, 'utf8');
      console.log(`✅ Markdown отчет сохранен в: ${outputPath}`);
    } else {
      console.log(markdownReport);
    }
  } else {
    // Default console analysis
    parser.analyze();
  }
})();

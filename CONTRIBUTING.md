# 🤝 Contributing to ZEUSUS Lighthouse Toolkit

We welcome contributions to the ZEUSUS Lighthouse Toolkit! This document provides guidelines and information for contributors.

## 🚀 Getting Started

### Prerequisites
- Node.js 14.0 or higher
- Git
- Basic knowledge of Lighthouse and web performance

### Setup
```bash
# Clone the repository
git clone https://github.com/bivex/zeusus.git
cd zeusus

# No dependencies needed (pure Node.js)
```

## 📋 Development Workflow

### 1. Choose an Issue
- Check [Issues](https://github.com/bivex/zeusus/issues) for open tasks
- Look for `good first issue` or `help wanted` labels
- Comment on the issue to indicate you're working on it

### 2. Create a Branch
```bash
# Create and switch to a new branch
git checkout -b feature/your-feature-name
# or
git checkout -b fix/issue-number-description
```

### 3. Make Changes
- Follow the existing code style
- Add comments for complex logic
- Test your changes thoroughly
- Update documentation if needed

### 4. Test Your Changes
```bash
# Run the test script
npm test
# or
./test.sh

# Test with sample data
node lighthouse-parser.cjs sample-report.json
node lighthouse-parser.cjs sample-report.json --markdown
```

### 5. Commit Your Changes
```bash
# Add your changes
git add .

# Commit with descriptive message
git commit -m "✨ Add: Brief description of your change

- Detailed explanation of what was changed
- Why this change was needed
- Any breaking changes or important notes"
```

### 6. Push and Create Pull Request
```bash
# Push your branch
git push origin feature/your-feature-name

# Create a Pull Request on GitHub
# - Use descriptive title
# - Reference related issues
# - Provide clear description of changes
```

## 🎯 Types of Contributions

### 🐛 Bug Fixes
- Fix parsing errors
- Correct audit categorization
- Fix output formatting issues
- Resolve compatibility problems

### ✨ New Features
- Add support for new Lighthouse audits
- Implement new output formats
- Add new analysis capabilities
- Enhance existing features

### 📚 Documentation
- Improve README and guides
- Add code comments
- Create usage examples
- Update API documentation

### 🧪 Testing
- Add test cases
- Improve test coverage
- Create sample Lighthouse reports
- Validate against real data

## 📝 Coding Guidelines

### Code Style
- Use consistent indentation (2 spaces)
- Follow existing naming conventions
- Add JSDoc comments for functions
- Keep functions focused and single-purpose

### Commit Messages
Use conventional commit format:
```
✨ Add: New feature description
🔧 Fix: Bug fix description
📚 Docs: Documentation update
🧪 Test: Testing improvements
🚀 Release: Version bump
```

### File Organization
- Keep parser logic in `lighthouse-parser.cjs`
- Development version in `lighthouse-parser.js`
- Patches in separate `.patch` files
- Documentation in `.md` files

## 🧪 Testing

### Running Tests
```bash
# Run all tests
npm test

# Test specific functionality
node lighthouse-parser.cjs test-report.json --category performance
node lighthouse-parser.cjs test-report.json --json
```

### Sample Data
Use these commands to generate test data:
```bash
# Generate Lighthouse report
npx lighthouse https://example.com --output=json --output-path=test-report.json

# Test with real data
node lighthouse-parser.cjs test-report.json
```

## 📋 Pull Request Guidelines

### Before Submitting
- ✅ Tests pass
- ✅ Code follows style guidelines
- ✅ Documentation updated
- ✅ Commit messages are clear
- ✅ Branch is up to date with main

### PR Description
Include:
- What changes were made
- Why they were needed
- How to test the changes
- Screenshots/screenshots if UI changes
- Links to related issues

### Review Process
1. Automated checks run
2. Code review by maintainers
3. Feedback and iterations
4. Approval and merge

## 🐛 Reporting Issues

### Bug Reports
Please include:
- Lighthouse version used
- Node.js version
- Sample Lighthouse JSON (anonymized if needed)
- Expected vs actual behavior
- Steps to reproduce

### Feature Requests
Please include:
- Use case description
- Expected behavior
- Why this feature would be valuable
- Alternative solutions considered

## 📞 Getting Help

- 📧 **Email**: support@b-b.top
- 💬 **GitHub Issues**: For bugs and feature requests
- 📖 **Documentation**: Check README and guides first

## 🎉 Recognition

Contributors will be:
- Listed in CHANGELOG.md
- Recognized in release notes
- Added to contributor list (if desired)

## 📜 License

By contributing, you agree that your contributions will be licensed under the same MIT License that covers the project.

---

**Thank you for contributing to ZEUSUS!** 🚀✨

Your contributions help make web performance analysis better for everyone.

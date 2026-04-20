# Contributing to DocMind AI

First off, thank you for considering contributing to DocMind AI! It's people like you that make DocMind AI such a great tool.

## Code of Conduct

This project and everyone participating in it is governed by our Code of Conduct. By participating, you are expected to uphold this code. Please report unacceptable behavior to the project maintainers.

## How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check the issue list as you might find out that you don't need to create one. When you are creating a bug report, please include as many details as possible:

* **Use a clear and descriptive title**
* **Describe the exact steps which reproduce the problem**
* **Provide specific examples to demonstrate the steps**
* **Describe the behavior you observed after following the steps**
* **Explain which behavior you expected to see instead and why**
* **Include screenshots and animated GIFs if possible**

### Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues. When creating an enhancement suggestion, please include:

* **Use a clear and descriptive title**
* **Provide a step-by-step description of the suggested enhancement**
* **Provide specific examples to demonstrate the steps**
* **Describe the current behavior and the expected behavior**
* **Explain why this enhancement would be useful**

### Pull Requests

* Follow the JavaScript/TypeScript/Python styleguides
* Include appropriate test cases
* Update documentation accordingly
* End all files with a newline

## Development Setup

1. Fork the repository
2. Clone your fork: `git clone https://github.com/yourusername/rag-document-ai.git`
3. Create a new branch: `git checkout -b my-feature-branch`
4. Follow the Quick Start guide in README.md
5. Make your changes
6. Test your changes thoroughly
7. Commit with clear messages: `git commit -m "feat: add new feature"`
8. Push to your fork: `git push origin my-feature-branch`
9. Create a Pull Request

## Styleguides

### Git Commit Messages

* Use the present tense ("Add feature" not "Added feature")
* Use the imperative mood ("Move cursor to..." not "Moves cursor to...")
* Limit the first line to 72 characters or less
* Reference issues and pull requests liberally after the first line

Commit message format:
```
type: subject

body

footer
```

Types:
- `feat:` A new feature
- `fix:` A bug fix
- `docs:` Documentation only changes
- `style:` Changes that do not affect the meaning of the code
- `refactor:` A code change that neither fixes a bug nor adds a feature
- `perf:` A code change that improves performance
- `test:` Adding or updating tests
- `chore:` Changes to build process or dependencies

### Python Styleguide

* Follow PEP 8
* Use meaningful variable names
* Add docstrings to functions and classes
* Comment complex logic

### TypeScript/JavaScript Styleguide

* Use TypeScript where possible
* Follow the ESLint configuration
* Use meaningful variable and function names
* Add JSDoc comments for public APIs
* Use `const` for variables that won't be reassigned
* Use `async/await` instead of promises when possible

### Component Styleguide

* Use functional components with hooks
* Keep components small and focused
* Use TypeScript interfaces for props
* Export components as named exports
* Add comments for complex logic

## Testing

### Backend
```bash
pytest
```

### Frontend
```bash
cd rag-document-ai/next-monorepo
npm test
```

### Linting
```bash
# Backend
pylint backend_app.py

# Frontend
cd rag-document-ai/next-monorepo
npm run lint
```

### Type Checking
```bash
cd rag-document-ai/next-monorepo
npm run typecheck
```

## Additional Notes

### Issue and Pull Request Labels

* `bug` - Something isn't working
* `enhancement` - New feature or request
* `documentation` - Improvements or additions to documentation
* `good first issue` - Good for newcomers
* `help wanted` - Extra attention is needed
* `in progress` - Currently being worked on
* `wontfix` - This will not be worked on

## Questions?

Feel free to open an issue with the `question` label or contact the maintainers directly.

Thank you for contributing! 🎉

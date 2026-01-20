# Contributing to KMSetjen DPD RI

Thank you for your interest in contributing to KMSetjen! This document provides guidelines and instructions for contributing to the project.

---

## 🎯 Code of Conduct

We are committed to providing a welcoming and inspiring community for all. Please read and follow our [Code of Conduct](docs/CODE_OF_CONDUCT.md).

---

## Getting Started

### Prerequisites
- Python 3.10+
- Node.js 16+
- Git
- PostgreSQL (or SQLite for development)
- Docker (optional)

### Development Setup

**1. Fork the repository**
```bash
# On GitHub, click "Fork" to create your copy
```

**2. Clone your fork**
```bash
git clone https://github.com/YOUR-USERNAME/kmsetjen-dpd-ri.git
cd kmsetjen-dpd-ri
```

**3. Add upstream remote**
```bash
git remote add upstream https://github.com/original-repo/kmsetjen-dpd-ri.git
git fetch upstream
```

**4. Set up backend**
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
python manage.py migrate
python manage.py runserver
```

**5. Set up frontend (new terminal)**
```bash
cd frontend
npm install
npm run dev
```

---

## 🔄 Development Workflow

### Creating a Feature Branch

```bash
# Update your main branch
git checkout main
git pull upstream main

# Create a feature branch
git checkout -b feature/your-feature-name
# or for bugfixes
git checkout -b fix/your-bugfix-name
```

### Branch Naming Conventions

- **Features**: `feature/descriptive-name`
- **Bugfixes**: `fix/issue-number-short-desc`
- **Hotfixes**: `hotfix/critical-issue`
- **Documentation**: `docs/what-you-updated`

### Commit Message Format

Follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types:**
- `feat`: A new feature
- `fix`: A bug fix
- `docs`: Documentation only changes
- `style`: Changes that don't affect code meaning (formatting, missing semicolons, etc.)
- `refactor`: Code change that neither fixes a bug nor adds a feature
- `perf`: Code change that improves performance
- `test`: Adding missing tests or correcting existing tests
- `chore`: Changes to build process, dependencies, or tooling

**Examples:**
```bash
git commit -m "feat(auth): add Google OAuth integration"
git commit -m "fix(articles): resolve pagination bug on ArticlesPage"
git commit -m "docs: update installation guide for Windows users"
git commit -m "refactor(api): simplify error handling in views"
git commit -m "test: add unit tests for AuthContext"
```

---

## 💻 Coding Standards

### Python (Backend)

**Style Guide:** PEP 8

**Tools:**
- `black` - Code formatting
- `flake8` - Linting
- `isort` - Import sorting

**Run formatters:**
```bash
cd backend
black .
isort .
flake8 .
```

**Code Style Tips:**
- Use type hints for functions: `def get_article(id: int) -> Article:`
- Document complex functions with docstrings
- Keep functions small and focused (< 50 lines preferred)
- Use meaningful variable names
- Add comments only for "why", not "what"

**Django Best Practices:**
- Use Django ORM instead of raw SQL
- Keep views logic minimal, move to services/utilities
- Use serializers for API responses
- Implement proper permissions on views
- Write tests for all endpoints

### JavaScript/React (Frontend)

**Style Guide:** Airbnb JavaScript Style Guide with React extensions

**Tools:**
- `eslint` - Linting
- `prettier` - Code formatting

**Run formatters:**
```bash
cd frontend
npm run lint
npm run format
```

**Code Style Tips:**
- Use functional components with hooks
- Extract reusable logic to custom hooks
- Keep components focused (single responsibility)
- Use descriptive component and variable names
- Add prop-types or TypeScript for type checking
- Write comments for non-obvious logic

**React Best Practices:**
- Use Context API for global state
- Implement error boundaries
- Lazy load large components
- Optimize re-renders with React.memo and useMemo
- Handle loading and error states
- Use semantic HTML

---

## 🧪 Testing

### Backend Tests

```bash
cd backend
# Run all tests
python manage.py test

# Run tests for a specific app
python manage.py test apps.articles

# Run with coverage
coverage run --source='.' manage.py test
coverage report
```

**Test Guidelines:**
- Write tests for all new features
- Aim for >80% code coverage
- Test both success and failure cases
- Use descriptive test names
- Group related tests in test classes

### Frontend Tests

```bash
cd frontend
# Run all tests
npm test

# Run tests with coverage
npm test -- --coverage

# Run tests in watch mode
npm test -- --watch
```

**Test Guidelines:**
- Write tests for all components
- Test user interactions (click, input, etc.)
- Mock API calls
- Test error states
- Use meaningful test descriptions

---

## 🎨 UI/UX Guidelines

- **Consistency**: Use existing components and patterns
- **Accessibility**: Ensure WCAG 2.1 AA compliance
- **Responsive**: Test on mobile, tablet, desktop
- **Bilingual**: Support both Indonesian and English
- **Dark Mode**: Ensure dark mode compatibility
- **Performance**: Keep components lightweight

---

## 📝 Documentation Standards

### Code Comments
```python
# Good: Explains WHY
# We cache the result because this query is expensive and rarely changes
result = expensive_query()

# Bad: Explains WHAT (obvious from code)
# Get the article
article = Article.objects.get(id=1)
```

### Function Docstrings
```python
def create_article(title: str, content: str, author: User) -> Article:
    """
    Create a new article.

    Args:
        title: Article title (max 255 chars)
        content: Article content in Markdown
        author: User object of article author

    Returns:
        Article: Created article instance

    Raises:
        ValueError: If title is empty
    """
```

### README Files
- Each directory can have its own README.md
- Document the purpose of the directory
- Include setup/usage instructions
- Link to related documentation

---

## 🔐 Security Guidelines

- **Never commit secrets** (.env files, API keys, tokens)
- **Validate all inputs** (frontend and backend)
- **Sanitize database queries** (use ORM, parameterized queries)
- **Use HTTPS** in production
- **Implement CORS** properly
- **Hash passwords** (Django handles this)
- **Use environment variables** for configuration
- **Report vulnerabilities** privately (don't post in issues)

---

## 🐛 Bug Reports

### Before Creating an Issue

1. Check if the bug already exists in [Issues](https://github.com/your-org/kmsetjen/issues)
2. Reproduce the bug consistently
3. Gather information about your environment

### Creating a Bug Report

Include:
- Clear title describing the issue
- Detailed steps to reproduce
- Expected behavior
- Actual behavior
- Screenshots/videos if applicable
- Environment (OS, browser, Python version, etc.)
- Error messages/logs

**Template:**
```
**Describe the bug**
A clear description of what the bug is.

**To Reproduce**
Steps to reproduce the behavior:
1. Go to '...'
2. Click on '...'
3. See error

**Expected behavior**
What you expected to happen.

**Actual behavior**
What actually happened.

**Screenshots**
If applicable, add screenshots.

**Environment**
- OS: [e.g. Windows 10]
- Browser: [e.g. Chrome 120]
- Python: [e.g. 3.10.5]
```

---

## ✨ Feature Requests

### Before Creating a Request

1. Check if the feature already exists
2. Search existing issues for similar requests
3. Consider if the feature aligns with project goals

### Creating a Feature Request

Include:
- Clear title describing the feature
- Detailed description of what you want
- Why you need this feature
- Examples or mockups if applicable
- Possible implementation approach

**Template:**
```
**Is your feature request related to a problem?**
Describe the problem you're trying to solve.

**Describe the solution you'd like**
Clear description of what you want to happen.

**Describe alternatives you've considered**
Other approaches or features that might solve this.

**Additional context**
Add any other context, mockups, or examples.
```

---

## 🔄 Pull Request Process

### Before Submitting

1. **Update your branch** with latest upstream changes:
   ```bash
   git fetch upstream
   git rebase upstream/main
   ```

2. **Run tests and checks:**
   ```bash
   # Backend
   cd backend
   python manage.py test
   black . && flake8 .

   # Frontend
   cd frontend
   npm test && npm run lint
   ```

3. **Update documentation** if needed

4. **Create a descriptive commit message**

### Creating the Pull Request

1. Push your branch to your fork:
   ```bash
   git push origin feature/your-feature-name
   ```

2. Go to GitHub and create a Pull Request

3. Fill in the PR template with:
   - Description of changes
   - Related issues (use #issue-number)
   - Type of change (feature, bugfix, documentation, etc.)
   - Testing done
   - Screenshots if UI changes

4. Wait for reviews

### PR Title Format
```
[TYPE] Brief description

Types: feat, fix, docs, refactor, test, chore
Examples:
- feat: Add user profile page
- fix: Resolve article pagination bug
- docs: Update API documentation
```

### Handling Feedback

- Be open to suggestions
- Respond to comments respectfully
- Make requested changes in new commits
- Mark conversations as resolved

---

## ✅ Acceptance Criteria

Your PR will be merged when it:

- ✅ Has at least 1 approved review
- ✅ All tests pass
- ✅ No merge conflicts
- ✅ Code follows style guidelines
- ✅ Documentation is updated
- ✅ Commit messages are clear
- ✅ No sensitive data is committed

---

## 🚀 After Your PR is Merged

- Celebrate! 🎉
- Delete your feature branch
- Update your local main branch:
  ```bash
  git checkout main
  git pull upstream main
  ```

---

## 📚 Additional Resources

- [Django Documentation](https://docs.djangoproject.com/)
- [React Documentation](https://react.dev)
- [REST API Best Practices](https://restfulapi.net/)
- [Conventional Commits](https://www.conventionalcommits.org/)
- [Semantic Versioning](https://semver.org/)
- [Project Structure](docs/PROJECT_STRUCTURE.md)
- [API Documentation](docs/API_DOCUMENTATION.md)

---

## 🤔 Questions?

- Check the [FAQ](docs/FAQ.md)
- Browse existing [Discussions](https://github.com/your-org/kmsetjen/discussions)
- Create a new Discussion if you can't find answers
- Join our community chat (if available)

---

## 🙌 Thank You!

Thank you for contributing to making KMSetjen better. Your effort and time are greatly appreciated!

**Happy coding! 🚀**

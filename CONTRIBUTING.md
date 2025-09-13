# Contributing to OpenChat Plugin

Thank you for your interest in contributing to the OpenChat Plugin for ElizaOS! This document provides guidelines and information for contributors.

## 🤝 How to Contribute

### Types of Contributions

We welcome various types of contributions:

- **Bug reports** - Help us identify and fix issues
- **Feature requests** - Suggest new functionality
- **Code contributions** - Implement features, fix bugs, improve performance
- **Documentation** - Improve guides, examples, and API documentation
- **Testing** - Add test coverage, improve test quality
- **Examples** - Create usage examples and tutorials

### Before You Start

1. **Check existing issues** - Look for similar bugs or feature requests
2. **Review the roadmap** - See if your idea aligns with planned features
3. **Discuss major changes** - Open an issue to discuss significant modifications
4. **Read the code** - Familiarize yourself with the codebase structure

## 🛠️ Development Setup

### Prerequisites

- Node.js 18+ and npm 8+
- Internet Computer SDK (DFX)
- Git
- TypeScript knowledge
- Basic understanding of Internet Computer and OpenChat

### Local Development

1. **Fork and clone the repository**
   ```bash
   git clone https://github.com/your-username/openchat-plugin.git
   cd openchat-plugin
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment**
   ```bash
   cp .env.example .env.development
   # Edit .env.development with your test values
   ```

4. **Install IC SDK**
   ```bash
   sh -ci "$(curl -fsSL https://sdk.dfinity.org/install.sh)"
   ```

5. **Run tests**
   ```bash
   npm test
   ```

6. **Start development**
   ```bash
   npm run dev
   ```

### Development Workflow

1. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes**
   - Follow the coding standards
   - Add tests for new functionality
   - Update documentation as needed

3. **Test your changes**
   ```bash
   npm test
   npm run test:coverage
   npm run lint
   npm run type-check
   ```

4. **Commit your changes**
   ```bash
   git add .
   git commit -m "feat: add your feature description"
   ```

5. **Push and create a pull request**
   ```bash
   git push origin feature/your-feature-name
   ```

## 📋 Coding Standards

### TypeScript Guidelines

- Use TypeScript for all code
- Enable strict mode
- Provide proper type definitions
- Use interfaces for complex types
- Document public APIs with JSDoc

### Code Style

We use Prettier and ESLint for consistent code formatting:

```bash
# Format code
npm run format

# Lint code
npm run lint

# Fix linting issues
npm run lint:fix
```

### Naming Conventions

- **Files**: kebab-case (`message-handler.ts`)
- **Classes**: PascalCase (`OpenChatClient`)
- **Functions/Variables**: camelCase (`sendMessage`)
- **Constants**: UPPER_SNAKE_CASE (`OPENCHAT_CANISTER_ID`)
- **Types/Interfaces**: PascalCase (`OpenChatConfig`)

### Project Structure

```
src/
├── actions/           # ElizaOS actions
├── evaluators/        # Message evaluators
├── providers/         # Context providers
├── utils/             # Utility functions
├── types/             # Type definitions
├── tests/             # Test files
└── examples/          # Usage examples
```

## 🧪 Testing Guidelines

### Test Types

1. **Unit Tests** - Test individual functions and classes
2. **Integration Tests** - Test component interactions
3. **End-to-End Tests** - Test complete workflows

### Writing Tests

- Use Jest as the testing framework
- Write descriptive test names
- Test both success and error cases
- Mock external dependencies
- Aim for high code coverage (>80%)

### Test Structure

```typescript
describe('OpenChatClient', () => {
  let client: OpenChatClient;
  let mockConfig: OpenChatConfig;

  beforeEach(() => {
    mockConfig = createTestConfig();
    client = new OpenChatClient(mockConfig);
  });

  afterEach(async () => {
    await client.cleanup();
  });

  describe('sendMessage', () => {
    it('should send a text message successfully', async () => {
      // Arrange
      const recipient = Principal.fromText('test-principal');
      const message = 'Hello, World!';

      // Act
      const result = await client.sendMessage(recipient, message);

      // Assert
      expect(result).toBeDefined();
      expect('Success' in result).toBe(true);
    });

    it('should handle network errors gracefully', async () => {
      // Test error handling
    });
  });
});
```

### Running Tests

```bash
# Run all tests
npm test

# Run specific test file
npm test -- message-handler.test.ts

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage
```

## 📚 Documentation

### Code Documentation

- Use JSDoc for public APIs
- Include examples in documentation
- Document complex algorithms
- Explain non-obvious code

```typescript
/**
 * Sends a message to an OpenChat user or group
 * 
 * @param recipient - The Principal ID of the message recipient
 * @param content - The message content (text or rich content)
 * @param options - Additional message options
 * @returns Promise resolving to the send result
 * 
 * @example
 * ```typescript
 * const result = await client.sendMessage(
 *   Principal.fromText('rdmx6-jaaaa-aaaah-qacaa-cai'),
 *   'Hello from ElizaOS!',
 *   { senderName: 'My Agent' }
 * );
 * ```
 */
async sendMessage(
  recipient: Principal,
  content: MessageContent | string,
  options: SendMessageOptions = {}
): Promise<SendMessageResponse>
```

### README Updates

When adding new features:
- Update the feature list
- Add usage examples
- Update configuration options
- Add any new requirements

## 🐛 Bug Reports

### Before Reporting

1. **Search existing issues** - Check if the bug is already reported
2. **Try the latest version** - Ensure you're using the most recent release
3. **Minimal reproduction** - Create a minimal example that reproduces the issue

### Bug Report Template

```markdown
## Bug Description
A clear and concise description of the bug.

## Steps to Reproduce
1. Go to '...'
2. Click on '....'
3. Scroll down to '....'
4. See error

## Expected Behavior
What you expected to happen.

## Actual Behavior
What actually happened.

## Environment
- Plugin Version: [e.g., 1.0.0]
- Node.js Version: [e.g., 18.17.0]
- ElizaOS Version: [e.g., 1.0.0]
- Operating System: [e.g., Ubuntu 20.04]
- OpenChat Canister: [e.g., rdmx6-jaaaa-aaaah-qacaa-cai]

## Additional Context
Add any other context about the problem here.

## Logs
```
Include relevant error logs or stack traces
```
```

## ✨ Feature Requests

### Feature Request Template

```markdown
## Feature Description
A clear and concise description of the feature you'd like to see.

## Problem Statement
What problem does this feature solve? What use case does it address?

## Proposed Solution
Describe how you envision this feature working.

## Alternatives Considered
What other approaches have you considered?

## Additional Context
Add any other context, mockups, or examples about the feature request.

## Implementation Notes
If you have ideas about how this could be implemented, please share.
```

## 🔄 Pull Request Process

### Before Submitting

- [ ] Tests pass locally
- [ ] Code is properly formatted
- [ ] Documentation is updated
- [ ] Commit messages follow conventions
- [ ] Branch is up to date with main

### Pull Request Template

```markdown
## Description
Brief description of the changes.

## Type of Change
- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update

## Testing
- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] Manual testing completed

## Checklist
- [ ] My code follows the project's coding standards
- [ ] I have performed a self-review of my code
- [ ] I have commented my code, particularly in hard-to-understand areas
- [ ] I have made corresponding changes to the documentation
- [ ] My changes generate no new warnings
- [ ] I have added tests that prove my fix is effective or that my feature works
- [ ] New and existing unit tests pass locally with my changes

## Screenshots (if applicable)
Add screenshots to help explain your changes.

## Related Issues
Closes #(issue number)
```

### Review Process

1. **Automated checks** - CI/CD pipeline runs tests and checks
2. **Code review** - Maintainers review the code
3. **Feedback** - Address any requested changes
4. **Approval** - Once approved, the PR will be merged

## 🏗️ Architecture Guidelines

### Adding New Actions

1. Create action file in `src/actions/`
2. Implement the Action interface
3. Add validation logic
4. Include examples
5. Export from `src/actions/index.ts`
6. Add tests

```typescript
// src/actions/new-action.ts
export const newAction: Action = {
  name: 'NEW_OPENCHAT_ACTION',
  similes: ['ALTERNATIVE_NAME'],
  description: 'Description of what this action does',
  validate: async (runtime, message) => {
    // Validation logic
  },
  handler: async (runtime, message, state, options, callback) => {
    // Action implementation
  },
  examples: [
    // Usage examples
  ],
};
```

### Adding New Types

1. Add to `src/types/openchat.types.ts`
2. Use descriptive names
3. Include JSDoc documentation
4. Export from main index

### Adding Utilities

1. Create in `src/utils/`
2. Write comprehensive tests
3. Document public functions
4. Consider error handling

## 🔒 Security Guidelines

### Security Considerations

- Never commit private keys or identity files
- Validate all inputs from external sources
- Use secure random generation for identities
- Implement proper error handling to avoid information leakage
- Follow principle of least privilege

### Reporting Security Issues

For security vulnerabilities, please email [security@elizaos.com] instead of opening a public issue.

## 📊 Performance Guidelines

### Performance Best Practices

- Minimize IC canister calls
- Implement proper caching
- Use connection pooling
- Implement circuit breakers for resilience
- Monitor memory usage

### Benchmarking

```bash
# Run performance tests
npm run test:performance

# Profile memory usage
npm run profile:memory
```

## 🌐 Internet Computer Guidelines

### IC Best Practices

- Understand the actor model
- Handle async operations properly
- Implement proper error handling for IC-specific errors
- Use appropriate retry strategies
- Consider canister upgrade implications

### Candid Interface Updates

When updating Candid interfaces:
1. Verify compatibility with existing deployments
2. Update type definitions
3. Test with both old and new canister versions
4. Document breaking changes

## 📝 Commit Message Guidelines

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

### Types

- `feat`: A new feature
- `fix`: A bug fix
- `docs`: Documentation only changes
- `style`: Changes that do not affect the meaning of the code
- `refactor`: A code change that neither fixes a bug nor adds a feature
- `perf`: A code change that improves performance
- `test`: Adding missing tests or correcting existing tests
- `chore`: Changes to the build process or auxiliary tools

### Examples

```
feat(actions): add support for crypto transactions
fix(client): handle network timeouts gracefully
docs(readme): update installation instructions
test(handler): add tests for message polling
```

## 🏷️ Release Process

### Versioning

We use [Semantic Versioning](https://semver.org/):
- `MAJOR.MINOR.PATCH`
- Major: Breaking changes
- Minor: New features (backward compatible)
- Patch: Bug fixes (backward compatible)

### Release Checklist

- [ ] Update version in package.json
- [ ] Update CHANGELOG.md
- [ ] Run full test suite
- [ ] Update documentation
- [ ] Create release notes
- [ ] Tag the release
- [ ] Publish to npm

## 🎯 Roadmap Contributions

### Current Priorities

1. **WebSocket Support** - Real-time message delivery
2. **Advanced Crypto Integration** - Enhanced transaction handling
3. **Community Features** - Governance integration
4. **Performance Optimization** - Reduce latency and resource usage

### Suggesting Roadmap Items

Open an issue with the `roadmap` label to suggest new roadmap items.

## 🆘 Getting Help

### Resources

- **Documentation**: Check README.md and examples/
- **Issues**: Search existing GitHub issues
- **Discussions**: Use GitHub Discussions for questions
- **Discord**: Join the ElizaOS Discord server

### Mentorship

New contributors can request mentorship by commenting on issues labeled `good first issue` or `help wanted`.

## 📜 License

By contributing to this project, you agree that your contributions will be licensed under the MIT License.

## 🙏 Recognition

Contributors are recognized in:
- CONTRIBUTORS.md file
- Release notes
- Project documentation

Thank you for contributing to the OpenChat Plugin! 🚀
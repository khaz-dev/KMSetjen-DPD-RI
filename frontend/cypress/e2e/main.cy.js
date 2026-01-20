describe('Login & Authentication Flow', () => {
  beforeEach(() => {
    cy.visit('/login');
  });

  it('should display login form', () => {
    cy.get('input[type="text"]').should('be.visible');
    cy.get('input[type="password"]').should('be.visible');
    cy.get('button[type="submit"]').should('be.visible').contains('Login');
  });

  it('should show validation error on empty submit', () => {
    cy.get('button[type="submit"]').click();
    cy.get('.error').should('be.visible');
  });

  it('should successfully login with valid credentials', () => {
    cy.get('input[type="text"]').type('admin_user');
    cy.get('input[type="password"]').type('AdminPassword123!');
    cy.get('button[type="submit"]').click();
    
    cy.url().should('not.include', '/login');
    cy.get('[data-cy="dashboard-welcome"]').should('be.visible');
  });

  it('should show error on invalid credentials', () => {
    cy.get('input[type="text"]').type('invalid_user');
    cy.get('input[type="password"]').type('wrongpassword');
    cy.get('button[type="submit"]').click();
    
    cy.get('.alert-danger').should('be.visible').contains('Invalid credentials');
  });

  it('should remember user after login', () => {
    cy.get('input[type="text"]').type('admin_user');
    cy.get('input[type="password"]').type('AdminPassword123!');
    cy.get('button[type="submit"]').click();
    
    cy.reload();
    cy.url().should('not.include', '/login');
  });
});

describe('Article Creation Workflow', () => {
  beforeEach(() => {
    // Login first
    cy.visit('/login');
    cy.get('input[type="text"]').type('editor_user');
    cy.get('input[type="password"]').type('EditorPassword123!');
    cy.get('button[type="submit"]').click();
    
    // Navigate to editor
    cy.visit('/editor/dashboard');
  });

  it('should display editor dashboard', () => {
    cy.get('h1').should('contain', 'Editor Dashboard');
    cy.get('[data-cy="create-article-btn"]').should('be.visible');
  });

  it('should open create article modal', () => {
    cy.get('[data-cy="create-article-btn"]').click();
    cy.get('[data-cy="article-modal"]').should('be.visible');
  });

  it('should create new article successfully', () => {
    cy.get('[data-cy="create-article-btn"]').click();
    
    cy.get('input[name="title"]').type('Test Article Title');
    cy.get('select[name="category"]').select('Technology');
    cy.get('textarea[name="excerpt"]').type('This is a test article excerpt');
    cy.get('.editor').type('Article content here...');
    
    cy.get('[data-cy="save-draft-btn"]').click();
    cy.get('.alert-success').should('be.visible').contains('saved');
  });

  it('should submit article for review', () => {
    cy.get('[data-cy="create-article-btn"]').click();
    
    cy.get('input[name="title"]').type('Review Article');
    cy.get('select[name="category"]').select('Science');
    cy.get('textarea[name="excerpt"]').type('Article for review');
    cy.get('.editor').type('Article content...');
    
    cy.get('[data-cy="submit-review-btn"]').click();
    cy.get('.modal-confirm').should('be.visible');
    cy.get('[data-cy="confirm-submit-btn"]').click();
    
    cy.get('.alert-success').should('be.visible').contains('submitted');
  });
});

describe('Admin Panel - User Management', () => {
  beforeEach(() => {
    // Login as admin
    cy.visit('/login');
    cy.get('input[type="text"]').type('admin_user');
    cy.get('input[type="password"]').type('AdminPassword123!');
    cy.get('button[type="submit"]').click();
    
    // Navigate to user management
    cy.visit('/admin/users');
  });

  it('should display user list', () => {
    cy.get('[data-cy="user-table"]').should('be.visible');
    cy.get('[data-cy="user-row"]').should('have.length.greaterThan', 0);
  });

  it('should search users', () => {
    cy.get('[data-cy="search-input"]').type('john');
    cy.get('[data-cy="user-row"]').should('be.visible');
  });

  it('should create new user', () => {
    cy.get('[data-cy="add-user-btn"]').click();
    
    cy.get('input[name="username"]').type('new_user');
    cy.get('input[name="email"]').type('newuser@example.com');
    cy.get('input[name="first_name"]').type('New');
    cy.get('input[name="last_name"]').type('User');
    cy.get('input[name="is_active"]').check();
    
    cy.get('[data-cy="create-user-btn"]').click();
    cy.get('.alert-success').should('be.visible');
  });

  it('should edit user', () => {
    cy.get('[data-cy="user-row"]').first().find('[data-cy="edit-btn"]').click();
    
    cy.get('input[name="first_name"]').clear().type('Updated');
    cy.get('[data-cy="save-user-btn"]').click();
    
    cy.get('.alert-success').should('be.visible');
  });

  it('should delete user with confirmation', () => {
    cy.get('[data-cy="user-row"]').first().find('[data-cy="delete-btn"]').click();
    cy.get('.modal-confirm').should('be.visible').contains('Are you sure');
    cy.get('[data-cy="confirm-delete-btn"]').click();
    
    cy.get('.alert-success').should('be.visible');
  });

  it('should activate/deactivate user', () => {
    cy.get('[data-cy="user-row"]').first().find('[data-cy="toggle-status-btn"]').click();
    cy.get('.alert-success').should('be.visible');
  });
});

describe('Admin Panel - Article Moderation', () => {
  beforeEach(() => {
    // Login as admin
    cy.visit('/login');
    cy.get('input[type="text"]').type('admin_user');
    cy.get('input[type="password"]').type('AdminPassword123!');
    cy.get('button[type="submit"]').click();
    
    // Navigate to moderation
    cy.visit('/admin/articles');
  });

  it('should display moderation tabs', () => {
    cy.get('[data-cy="pending-tab"]').should('be.visible');
    cy.get('[data-cy="approved-tab"]').should('be.visible');
    cy.get('[data-cy="rejected-tab"]').should('be.visible');
    cy.get('[data-cy="published-tab"]').should('be.visible');
  });

  it('should display pending articles', () => {
    cy.get('[data-cy="pending-tab"]').click();
    cy.get('[data-cy="article-row"]').should('be.visible');
  });

  it('should approve article', () => {
    cy.get('[data-cy="pending-tab"]').click();
    cy.get('[data-cy="article-row"]').first().find('[data-cy="approve-btn"]').click();
    
    cy.get('[data-cy="article-modal"]').should('be.visible');
    cy.get('textarea[name="comment"]').type('Well written article');
    cy.get('[data-cy="confirm-approve-btn"]').click();
    
    cy.get('.alert-success').should('be.visible');
  });

  it('should reject article with reason', () => {
    cy.get('[data-cy="pending-tab"]').click();
    cy.get('[data-cy="article-row"]').first().find('[data-cy="reject-btn"]').click();
    
    cy.get('[data-cy="article-modal"]').should('be.visible');
    cy.get('textarea[name="reason"]').type('Needs more sources');
    cy.get('[data-cy="confirm-reject-btn"]').click();
    
    cy.get('.alert-success').should('be.visible');
  });
});

describe('Responsive Design', () => {
  it('should work on mobile viewport', () => {
    cy.viewport('iphone-x');
    cy.visit('/');
    cy.get('[data-cy="mobile-menu-toggle"]').should('be.visible');
  });

  it('should work on tablet viewport', () => {
    cy.viewport('ipad-2');
    cy.visit('/');
    cy.get('[data-cy="sidebar"]').should('exist');
  });

  it('should work on desktop viewport', () => {
    cy.viewport('macbook-15');
    cy.visit('/');
    cy.get('[data-cy="sidebar"]').should('be.visible');
  });
});

describe('Error Handling', () => {
  it('should handle network errors gracefully', () => {
    cy.intercept('/api/v1/**', { statusCode: 500 }).as('errorRequest');
    cy.visit('/admin/users');
    cy.get('.alert-danger').should('be.visible').contains('error');
  });

  it('should handle unauthorized access', () => {
    cy.intercept('/api/v1/**', { statusCode: 401 }).as('unauthorizedRequest');
    cy.visit('/admin');
    cy.url().should('include', '/login');
  });

  it('should show validation errors in forms', () => {
    cy.visit('/login');
    cy.get('button[type="submit"]').click();
    cy.get('.form-error').should('be.visible');
  });
});

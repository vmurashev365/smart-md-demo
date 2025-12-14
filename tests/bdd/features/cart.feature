@cart @smoke
Feature: Shopping Cart
  As a customer
  I want to manage my shopping cart
  So that I can prepare my order before purchase

  Background:
    Given the site is in Russian

  @smoke @cart-add
  Scenario: Add product to cart
    When user adds product 12345 to cart
    Then product appears in cart
    And cart counter shows 1

  @cart-multiple
  Scenario: Add multiple products
    When user adds product 12345 to cart
    And user adds product 12346 to cart
    Then cart contains 2 items
    And total equals sum of product prices

  @cart-quantity
  Scenario: Change product quantity
    Given cart contains product 12345
    When user changes product quantity to 3
    Then product quantity in cart equals 3
    And total is recalculated

  @cart-remove
  Scenario: Remove product from cart
    Given cart contains product 12345
    When user removes product from cart
    Then the cart is empty

  @cart-clear
  Scenario: Clear cart
    Given cart contains product 12345
    And cart contains product 67890
    When user clears cart
    Then the cart is empty
    And cart counter shows 0

  @cart-promo
  Scenario: Apply promo code
    Given cart contains product 12345
    When user applies promo code "WELCOME10"
    Then discount is applied to order
    And total amount decreased

  @cart-promo-invalid
  Scenario: Invalid promo code
    Given cart contains product 12345
    When user applies promo code "INVALID123"
    Then promo code is rejected
    And order amount unchanged

  @cart-persistence
  Scenario: Cart persistence between sessions
    When user adds product 12345 to cart
    And user refreshes page
    Then product remains in cart

  @cart-total
  Scenario: Correct total calculation
    When user adds product 12345 to cart
    And user adds product 67890 to cart
    Then cart total is correct

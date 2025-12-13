# language: en
@smoke @demo
Feature: Shopping Flow
  As a customer on Smart.md
  I want to search, browse and add products to cart
  So that I can purchase electronics online

  This feature covers the critical "Money Making Path" -
  the main conversion funnel that generates revenue.

  Background:
    Given the shopping cart is empty
    And I am on the Smart.md homepage

  @critical @happy-path
  Scenario: Complete search to cart flow (The Golden Path)
    When I search for "iPhone 15"
    And I wait for search results to load
    Then the search results should contain at least 3 products

    When I click on the first product in search results
    Then I should see the product detail page
    And I store the product name as "product_name"
    And I store the product price as "original_price"

    When I click the add to cart button
    And I click on the cart icon
    Then I should be on the shopping cart page
    And the cart should contain 1 product
    And the cart should contain the stored product "product_name"
    And the cart price should equal the stored "original_price"

  @cart @quantity 
  Scenario: Modify product quantity in cart
    Given I have added "Samsung Galaxy" to the cart
    When I click on the cart icon
    Then I should be on the shopping cart page

    # Store original price for one item
    And I store the cart total as "single_item_price"

    # Increase quantity to 2
    When I increase the product quantity to 2
    Then the cart should show quantity "2"
    And the total price should be doubled

    # Decrease quantity back to 1
    When I decrease the product quantity to 1
    Then the cart should show quantity "1"
    And the cart total should equal the stored "single_item_price"

    # Remove product completely
    When I click the remove product button
    Then the cart should show empty state

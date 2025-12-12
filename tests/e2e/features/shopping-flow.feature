# language: en
@smoke @demo
Feature: Shopping Flow
  As a customer on Smart.md
  I want to search, browse and add products to cart
  So that I can purchase electronics online

  This feature covers the critical "Money Making Path" -
  the main conversion funnel that generates revenue.

  Background:
    Given I am on the Smart.md homepage

  @critical @happy-path
  Scenario: Complete search to cart flow (The Golden Path)
    When I search for "iPhone 15"
    And I wait for search results to load
    Then the search results should contain at least 3 products
    
    When I click on the first product in search results
    Then I should see the product detail page
    And I store the product price as "original_price"
    
    When I click the "Adaugă în coș" button
    Then I should see a cart confirmation message
    And the cart icon should display "1" item
    
    When I click on the cart icon
    Then I should be on the shopping cart page
    And the cart should contain 1 product
    And the product name should contain "iPhone"
    And the cart price should equal the stored "original_price"

  @cart @quantity
  Scenario: Modify product quantity in cart
    Given I have added "Samsung Galaxy" to the cart
    When I click on the cart icon
    Then I should be on the shopping cart page
    
    When I increase the product quantity to 2
    Then the cart should show quantity "2"
    And the total price should be doubled
    
    When I click the remove product button
    Then the cart should be empty
    And I should see "Coșul este gol" message

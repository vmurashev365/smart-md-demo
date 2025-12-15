@needs_product @smoke
Feature: Dynamic Product Search
  As a QA Engineer
  I want to use dynamically fetched products
  So that tests remain stable even when product catalog changes

  Background:
    Given I am on the Smart.md homepage

  @dynamic_data
  Scenario: Search for a valid product using dynamic data injection
    When I search for a valid product
    Then the search results should contain at least 1 products
    When I click on the first product in search results
    Then I should see the product detail page
    And the product price should be greater than 2000 MDL

  @dynamic_data @cart
  Scenario: Add dynamically selected product to cart
    When I search for a valid product
    And I click on the first product in search results
    And I click the add to cart button
    Then I should see a cart confirmation message

  @dynamic_data @credit
  Scenario: Verify dynamically selected product qualifies for credit
    When I search for a valid product
    And I click on the first product in search results
    Then the product price should be greater than 2000 MDL
    # Product is guaranteed to be > 2000 MDL due to Dynamic Data Injection filter

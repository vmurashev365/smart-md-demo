@search @smoke
Feature: Product Search
  As a customer
  I want to search products by name
  So that I can quickly find what I need

  Background:
    Given the site is in Russian

  @smoke @search-basic
  Scenario: Search by exact product name
    When user searches for "iPhone"
    Then search results contain found products
    And results are relevant to query

  @smoke @search-cyrillic
  Scenario: Search in Russian language
    When user searches for "телефон"
    Then search results contain found products
    And results are relevant to query

  @search-partial
  Scenario: Partial search
    When user searches for "Sam"
    Then search results contain found products
    And results contain Samsung products

  @search-empty
  Scenario: Empty search result
    When user searches for "абракадабра123"
    Then search results are empty
    And no products found message is displayed

  @search-suggestions
  Scenario: Search autocomplete
    When user types "ipho" in search box
    Then search suggestions appear
    And suggestions contain relevant options

  @search-filters
  Scenario: Search with filters
    When user searches for "телефон"
    And applies price filter from 5000 to 15000 MDL
    Then search results contain found products
    And all products are in price range 5000-15000 MDL

  @search-category
  Scenario: Search within category
    Given user is in category "Smartphones"
    When user searches for "Samsung"
    Then search results contain found products
    And all products are from category "Smartphones"

  @search-special-chars
  Scenario: Search with special characters
    When user searches for "iPhone 15 Pro Max"
    Then search results contain found products

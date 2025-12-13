# language: en
@smoke @demo
Feature: Catalog Experience
  As a Smart.md customer
  I want to filter, sort products and use the site in my language
  So that I can find the best deals quickly on any device

  Smart.md is an aggregator with complex filtering.
  This feature tests dynamic content updates, localization,
  and mobile responsiveness.

  @filters @dynamic-content
  Scenario: Filter and sort products in catalog
    Given I am on the Smart.md homepage
    When I navigate to "Catalog" > "Smartphones"  category
    Then I should see the smartphones catalog
    And the product count should be greater than 10
    
    When I apply brand filter "Apple"
    And I wait for the product list to update
    Then all visible products should be "Apple" brand
    And the filter tag "Apple" should be displayed
    
    When I apply sorting "Prețul: mic spre mare"
    And I wait for the product list to update
    Then the products should be sorted by price ascending
    And the first product price should be less than the second product price
    
    When I clear all filters
    Then the product count should increase
    And no filter tags should be displayed

  @localization @language @known-issue
  Scenario: Switch language from Romanian to Russian
    Given I am on the Smart.md homepage
    When I search for "televizor"
    And I click on the first product in search results
    Then I should see the product detail page
    And the "Adauga in cos" button should be visible
    And I store the current URL as "ro_url"
    
    When I switch language to "RU"
    Then the URL should contain "/ru/" prefix
    And the URL path should match the stored "ro_url" path
    And the page should not return 404 error
    And the "В корзину" button should be visible
    # KNOWN DEFECT: Product titles remain in Romanian after language switch
    # Smart.md does not translate product names when changing language
    And the product title should be in Russian
    And the navigation menu should be in Russian

  @mobile @responsive
  Scenario: Mobile navigation and browsing
    Given I am using "iPhone SE" device emulation
    And I am on the Smart.md homepage
    When I ensure the language is set to "RO"
    Then the mobile layout should be displayed
    And the mobile menu icon should be visible
    
    When I tap on the mobile menu icon
    Then I should see main category links
    
    When I tap on "Smartphone" category
    Then I should see the smartphones catalog page
    And the products should be displayed in mobile grid
    And the product count should be greater than 5
    
    When I store the first product name as "catalog_product_name"
    And I store the first product price as "catalog_product_price"
    And I tap on the first product
    Then I should see the product detail page
    And the product name should match stored "catalog_product_name"
    And the product price should match stored "catalog_product_price"
    And the "Adauga in cos" button should be visible

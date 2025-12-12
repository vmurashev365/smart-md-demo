# language: en
@smoke @demo @moldova-specific
Feature: Credit Calculator
  As a Moldovan customer
  I want to calculate monthly credit payments
  So that I can decide if I can afford expensive electronics

  Credit/installment purchases are extremely popular in Moldova.
  This feature tests integration with local credit providers:
  IuteCredit, Microinvest, EasyCredit, Iute, etc.

  A tester from Western Europe might miss this - but we won't.

  Background:
    Given I am on the Smart.md homepage

  @critical @credit
  Scenario: Credit calculator opens and displays bank offers
    When I search for "MacBook Pro"
    And I wait for search results to load
    And I click on the first product in search results
    Then I should see the product detail page
    And the product price should be greater than 20000 MDL

    When I click the buy on credit button
    Then the credit calculator should be visible
    And I should see the monthly payment amount
    And I should see at least 2 credit provider options
    And the credit offers should include one of:
      | provider     |
      | IuteCredit   |
      | Microinvest  |
      | EasyCredit   |
      | Iute         |

    When I select "12 luni" payment term
    Then the monthly payment should be recalculated
    And the monthly payment should be approximately "product_price / 12"

    When I close the credit calculator modal
    Then I should be back on the product page
    And the add to cart button should still be visible

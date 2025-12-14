@credit @smoke
Feature: Credit Calculator
  As a customer
  I want to calculate credit cost
  So that I understand monthly payment amount

  Background:
    Given the site is in Russian

  @smoke @credit-basic
  Scenario: Basic credit calculation
    Given product costs 10000 MDL
    When user selects credit for 12 months
    Then calculator shows monthly payment
    And credit math is correct

  @credit-banks
  Scenario: List of available banks
    Given product costs 15000 MDL
    When user opens credit calculator
    Then available banks are displayed
    And each bank has its own terms

  @credit-terms
  Scenario Outline: Various credit terms
    Given product costs <amount> MDL
    When user selects credit for <term> months
    Then calculator shows monthly payment
    And monthly payment is less than total amount

    Examples:
      | amount | term |
      | 10000  | 6    |
      | 10000  | 12   |
      | 10000  | 24   |
      | 25000  | 12   |
      | 50000  | 36   |

  @credit-comparison
  Scenario: Compare bank offers
    Given product costs 20000 MDL
    When user compares credit conditions
    Then offers from different banks are displayed
    And user can select the best one

  @credit-validation
  Scenario: Minimum credit amount
    Given product costs 500 MDL
    When user tries to apply for credit
    Then credit is unavailable for small amounts

  @credit-math
  Scenario: Verify credit calculations
    Given product costs 30000 MDL
    When user selects credit for 24 months
    Then total payment exceeds product price
    And overpayment matches interest rate
    And credit math is correct

  @credit-interest
  Scenario: Credit overpayment
    Given product costs 20000 MDL
    When user selects credit for 12 months
    Then calculator shows monthly payment
    And overpayment is within normal range

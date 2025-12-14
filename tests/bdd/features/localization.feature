@localization @smoke
Feature: Site Localization
  As a user from Moldova
  I want to see the site in my language
  So that I can shop comfortably

  @smoke @locale-ru
  Scenario: Russian version of site
    Given the site is in Russian
    When user browses catalog
    Then categories are displayed in Russian
    And products are displayed in Russian
    And prices are displayed in Moldovan Lei

  @smoke @locale-ro @mock-skip
  Scenario: Romanian version of site
    Given the site is in Romanian
    When user browses catalog
    Then categories are displayed in Romanian
    And products are displayed in Romanian
    And prices are displayed in Moldovan Lei

  @locale-switch @mock-skip
  Scenario: Switch language from Russian to Romanian
    Given the site is in Russian
    And user browses catalog
    When user switches language to Romanian
    Then content changed to selected language
    And prices remain unchanged

  @locale-switch-back @mock-skip
  Scenario: Switch language from Romanian to Russian
    Given the site is in Romanian
    And user browses catalog
    When user switches language to Russian
    Then content changed to selected language
    And prices remain unchanged

  @locale-search
  Scenario: Search in Russian language
    Given the site is in Russian
    When user performs search in current language
    Then search results are in Russian

  @locale-search-ro @mock-skip
  Scenario: Search in Romanian language
    Given the site is in Romanian
    When user performs search in current language
    Then search results are in Romanian

  @locale-currency
  Scenario: Currency is always Moldovan Lei
    Given the site is in Russian
    When user browses catalog
    Then prices are displayed in Moldovan Lei

  @locale-currency-ro @mock-skip
  Scenario: Currency on Romanian version
    Given the site is in Romanian
    When user browses catalog
    Then prices are displayed in Moldovan Lei

"use strict";

let Mercury = module.exports;

// https://docs.mercury.com/reference/submit-onboarding-data
//
// How to scrape:
// 1. Copy <script data-initial-props='{...}'></script>
// 2. `var data='{...}'
// 3. `var decoded = encoded
//                      .replaceAll('&quot;', '"')
//                      .replaceAll('&apos;', '\'')
//                      .replaceAll('&amp;', '&')`
//                      .replaceAll('\\\\', '\\')
// 4. fail... it seems to be a bespoke JSON-like syntax, not JSON

let request = require("@root/request");

/** @typedef {"USCitizen"|"USResident"|"NonResident"} CitizenshipStatusOption */
Mercury.CITIZENSHIP_STATUS_OPTIONS = ["USCitizen", "USResident", "NonResident"];

/** @typedef {"CCorp"|"LLC"|"LLP"|"NonProfit"|"Partnership"|"ProfessionalCorporation"|"SCorp"|"SoleProprietorship"} CompanyStructureOption */
Mercury.COMPANY_STRUCTURE_OPTIONS = [
  "CCorp",
  "LLC",
  "LLP",
  "NonProfit",
  "Partnership",
  "ProfessionalCorporation",
  "SCorp",
  "SoleProprietorship",
];

/** @typedef {"ArticlesOfIncorporation"|"ArticlesOfOrganization"|"AssumedNameCertificate"|"CertificateOfGoodStanding"|"OtherBusinessDocumentation"|"TrustAgreement"|"CertificateOfFormation"} FormationDocumentTypeOption */
Mercury.FORMATION_DOCUMENT_TYPE_OPTIONS = [
  "ArticlesOfIncorporation",
  "ArticlesOfOrganization",
  "AssumedNameCertificate",
  "CertificateOfGoodStanding",
  "OtherBusinessDocumentation",
  "TrustAgreement",
  "CertificateOfFormation",
];

/** @typedef {"DriversLicense"|"Passport"|"StateID"|"AlienRegistrationCard"|"EmployeeAuthorizationDocument"} IdentificationTypeOption */
Mercury.IDENTIFICATION_TYPE_OPTIONS = [
  "DriversLicense",
  "Passport",
  "StateID",
  "AlienRegistrationCard",
  "EmployeeAuthorizationDocument",
];

/** @typedef {"accounting_and_tax_preparation"|"mercury_advertising"|"mercury_agriculture"|"art_and_photography"|"mercury_artificial_intelligence"|"mercury_augmented_reality"|"mercury_b2b"|"mercury_biotech"|"mercury_community"|"construction"|"mercury_consulting"|"mercury_consumer"|"mercury_crypto"|"mercury_developer_tools"|"mercury_drones"|"online_retailer"|"mercury_education"|"mercury_energy"|"mercury_enterprise"|"mercury_entertainment"|"mercury_financial_services"|"other_health_and_fitness_services"|"other_food_services"|"mercury_government"|"mercury_hardware"|"health_services"|"mercury_healthcare"|"insurance"|"private_investment_companies"|"legal_services_including_law_mercury"|"firms_marketing"|"mercury_marketplace"|"mercury_media"|"mercury_nonprofit"|"mercury_other"|"real_estate"|"employment_services"|"mercury_research"|"mercury_robotics"|"mercury_security"|"sports_teams_and_clubs"|"mercury_transportation"|"other_travel_services"|"mercury_virtual_reality"} IndustryOption */
Mercury.INDUSTRY_OPTIONS = [
  "accounting_and_tax_preparation",
  "mercury_advertising",
  "mercury_agriculture",
  "art_and_photography",
  "mercury_artificial_intelligence",
  "mercury_augmented_reality",
  "mercury_b2b",
  "mercury_biotech",
  "mercury_community",
  "construction",
  "mercury_consulting",
  "mercury_consumer",
  "mercury_crypto",
  "mercury_developer_tools",
  "mercury_drones",
  "online_retailer",
  "mercury_education",
  "mercury_energy",
  "mercury_enterprise",
  "mercury_entertainment",
  "mercury_financial_services",
  "other_health_and_fitness_services",
  "other_food_services",
  "mercury_government",
  "mercury_hardware",
  "health_services",
  "mercury_healthcare",
  "insurance",
  "private_investment_companies",
  "legal_services_including_law_mercury",
  "firms_marketing",
  "mercury_marketplace",
  "mercury_media",
  "mercury_nonprofit",
  "mercury_other",
  "real_estate",
  "employment_services",
  "mercury_research",
  "mercury_robotics",
  "mercury_security",
  "sports_teams_and_clubs",
  "mercury_transportation",
  "other_travel_services",
  "mercury_virtual_reality",
];

/**
 * @typedef {"ChiefExecutiveOfficer"|"ChiefOperatingOfficer"|"ChiefTechnologyOfficer"|"ChiefFinancialOfficer"|"Founder"|"President"|"GeneralPartner"|"Other"} JobTitleOption
 */
Mercury.JOB_TITLE_OPTIONS = [
  "ChiefExecutiveOfficer",
  "ChiefOperatingOfficer",
  "ChiefTechnologyOfficer",
  "ChiefFinancialOfficer",
  "Founder",
  "President",
  "GeneralPartner",
  "Other",
];

/**
 * @typedef {"LocalBusiness"|"ForeignWithLocalOperations"|"ForeignWithoutLocalOperations"} OperationsOption
 */
Mercury.OPERATIONS_OPTIONS = [
  "LocalBusiness",
  "ForeignWithLocalOperations",
  "ForeignWithoutLocalOperations",
];

/**
 * @typedef {"IsPep"|"IsNotPep"} PepOption
 */
Mercury.POLITICALLY_EXPOSED_OPTIONS = ["IsPep", "IsNotPep"];

/** @typedef {ApplicationPublic & ApplicationInternal} Application */

/**
 * @typedef ApplicationPublic
 * @prop {String} inviteEmail
 * @prop {BusinessAbout} about
 * @prop {BusinessContact} businessContactDetails
 * @prop {Array<BusinessOwner>} beneficialOwners
 * @prop {BusinessFormation} formationDetails
 * @prop {BusinessDetails} businessDetails
 * @prop {BusinessAddress} businessLegalAddress
 * @prop {BusinessAddress} businessPhysicalAddress
 * @prop {ApplicationType} applicationType
 */
/** @typedef {"DefaultApplication"|"PendingEINApplication"} ApplicationType */

/**
 * @typedef ApplicationInternal
 * @prop {String} partner - set internally
 * @prop {String} webhookURL - set internally
 */

/**
 * @typedef ApplicationResult
 * @prop {String} signupLink
 * @prop {String} onboardingDataId
 */

/**
 * @typedef ApplicationResponse
 * @prop {Boolean} ok
 * @prop {Uint16} statusCode
 * @prop {Object.<String, String>} headers
 * @prop {ApplicationResult} body
 */

/**
 * @typedef BusinessAbout
 * @prop {String} legalBusinessName
 * @prop {String} website
 * @prop {IndustryOption} industry
 * @prop {String} countryOfOperation - 2-character country code (ISO 3166-1 Alpha 2)
 * @prop {String} description
 * @prop {OperationsOption} operations
 */

/**
 * @typedef BusinessAddress
 * @prop {String} address1
 * @prop {String} address2
 * @prop {String} city
 * @prop {String} region - state or province
 * @prop {String} country - 2-char ISO code
 * @prop {String} postalCode
 */

/**
 * @typedef BusinessContact
 * @prop {String} address1
 * @prop {String} address2
 * @prop {String} city
 * @prop {String} state
 * @prop {String} postalCode
 * @prop {String} country
 * @prop {String} phoneNumber
 */

/**
 * @typedef BusinessFormation
 * @prop {CompanyStructureOption} companyStructure
 * @prop {String} federalEin
 * @prop {FormationDocumentTypeOption} formationDocumentType
 * @prop {String} formationDocumentFileBlob
 * @prop {String} eINDocumentFileBlob - NOTE: typo is locked :/
 */

/**
 * @typedef BusinessDetails
 * @prop {String} USOperations
 * @prop {String} WebPresence
 * @prop {String} InvalidWebsite
 */

/**
 * @typedef BusinessOwner
 * @prop {String} firstName
 * @prop {String} lastName
 * @prop {JobTitleOption} jobTitle
 * @prop {String} email
 * @prop {Number} percentOwnership
 * @prop {CitizenshipStatusOption} citizenshipStatus
 * @prop {IdentificationTypeOption} identificationType
 * @prop {String} address1
 * @prop {String} city
 * @prop {String} state
 * @prop {String} country - 2-digit code
 * @prop {String} postalCode
 * @prop {String} phoneNumber
 * @prop {PepOption} isPep - politically exposed person
 * @prop {String} dateOfBirth - YYYY-MM-DD
 * @prop {String} identificationBlob
 */

/**
 * @param {Object} opts
 * @param {String} [opts.baseUrl]
 * @param {String} opts.partnerId - Business Name, Ex: "AcmeInc"
 * @param {String} [opts.partnerSecret] - base64-encoded secret
 * @param {String} opts.webhookUrl
 */
Mercury.create = function ({
  baseUrl = "https://api.mercury.com",
  partnerId,
  //partnerSecret,
  webhookUrl,
}) {
  let mercury = {};

  /**
   * @param {Application} _application
   * @returns {Promise<ApplicationResponse>}
   */
  mercury.apply = async function (_application) {
    let application = mercury._complete(_application);

    // empty strings must be converted to nulls
    let applicationJson = JSON.stringify(application, emptyStringsToNull);
    application = JSON.parse(applicationJson);
    let options = {
      method: "POST",
      url: `${baseUrl}/api/v1/submit-onboarding-data`,
      headers: {
        // Authorization: `Bearer ${partnerSecret}`,
      },
      json: application,
    };

    let resp = await request(options);
    return await resp;
  };

  /**
   * @param {String} key
   * @param {any} value
   */
  function emptyStringsToNull(key, value) {
    if ("" === value) {
      return null;
    }

    return value;
  }

  /**
   * @param {Application} _application
   * @returns {Application}
   */
  mercury._complete = function (_application) {
    let application = Object.assign(
      {
        partner: partnerId,
        webhookURL: webhookUrl,
      },
      _application
    );

    return application;
  };

  return mercury;
};

/** @typedef {Number} Uint16 */

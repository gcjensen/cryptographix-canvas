export enum EMV
{
  // EMV class code
  CLA_EMV = 0x80,

  // Get challenge instruction code
  INS_GET_CHALLENGE = 0x84,

  // Block Application instruction code
  INS_BLOCK_APPLICATION = 0x1E,

  // Unblock application instruction code
  INS_UNBLOCK_APPLICATION = 0x18,

  // Unblock change PIN instruction code
  INS_UNBLOCK_CHANGE_PIN = 0x24,

  // Get processing options instruction code
  INS_GET_PROCESSING_OPTIONS = 0xA8,

  // Generate AC instruction code
  INS_GENERATE_AC = 0xAE,

  // Parameter P2 = plain PIN
  P2_PIN_TYPE_PLAIN = 0x80,

  // Parameter P2 = enciphered PIN
  P2_PIN_TYPE_ENCIPHERED = 0x88,

  // Payment System Directory
  TAG_PAYMENT_SYSTEM_DIRECTORY_RECORD = 0x70,

  // Directory Discretionary Template
  TAG_APPLICATION_DIR_DISCRETIONARY_TEMPLATE = 0x73,

  // Dedicated File (DF) Name
  TAG_DF_NAME = 0x84,

  // Directory Definition File (DDF) Name
  TAG_DDF_NAME = 0x9D,

  // File Control Information (FCI) Issuer Discretionary Data
  TAG_FCI_ISSUER_DISCRETIONARY_DATA_TEMPLATE = 0xBF0C,

  // Log Entry
  TAG_FCI_LOG_ENTRY = 0x9F4D,

  // ADF Name
  TAG_ADF_NAME = 0x4F,

  // Application Preferred Name
  TAG_APPLICATION_PREFERRED_NAME = 0x9F12,

  // Application Priority Indicator
  TAG_APPLICATION_PRIORITY_INDICATOR = 0x87,

  // SFI of the Directory Elementary File
  TAG_SFI = 0x88,

  // Issuer Code Table Index
  TAG_ISSUER_CODE_TABLE_INDEX = 0x9F11,

  // Additional Terminal Capabilities
  TAG_ADDITIONAL_TERMINAL_CAPABILITIES = 0x9F40,

  // Application File Locator
  TAG_AFL = 0x94,

  // Application Identifier (AID) terminal
  TAG_AID_TERMINAL = 0x9F06,

  // Application Interchange Profile
  TAG_AIP = 0x82,

  // Amount Authorised (Numeric)
  TAG_AMOUNT_AUTHORIZED = 0x9F02,

  // Amount Authorised (Binary)
  TAG_AMOUNT_AUTHORIZED_BIN = 0x81,

  // Amount Authorised Other (Numeric)
  TAG_AMOUNT_OTHER = 0x9F03,

  // Amount Authorised Other (Binary)
  TAG_AMOUNT_OTHER_BIN = 0x9F04,

  // Application Cryptogram
  TAG_APPLICATION_CRYPTOGRAM = 0x9F26,

  // Application Currency Code
  TAG_APPLICATION_CURRENCY_CODE = 0x9F42,

  // Application Currency Exponent
  TAG_APPLICATION_CURRENCY_EXPONENT = 0x9F44,

  // Application Reference Currency Exponent
  TAG_APPLICATION_REFERENCE_CURRENCY_EXPONENT = 0x9F43,

  // Application Data Template
  TAG_APPLICATION_DATA_TEMPLATE = 0x70,

  // Application Discretionary Data
  TAG_APPLICATION_DISCRETIONARY_DATA = 0x9F05,

  // Application Reference Currency
  TAG_APPLICATION_REFERENCE_CURRENCY = 0x9F3B,

  // Application Usage Control
  TAG_APPLICATION_USAGE_CONTROL = 0x9F07,

  // Application Version Number
  TAG_APPLICATION_VERSION_NUMBER = 0x9F08,

  // Application Transaction Counter (ATC)
  TAG_ATC = 0x9F36,

  // Authorisation Code
  TAG_AUTHORIZATION_CODE = 0x89,

  // Authorisation Response Code
  TAG_AUTHORIZATION_RESPONSE_CODE = 0x8A,

  // Card Holder Name Extended
  TAG_CARDHOLDER_NAME_EXTENDED = 0x9F0B,

  // Card Risk Management Data Object List 1 (CDOL1)
  TAG_CDOL1 = 0x8C,

  // Card Risk Management Data Object List 2 (CDOL2)
  TAG_CDOL2 = 0x8D,

  // Certification Authority Public Key Index (Terminal)
  TAG_CERTIFICATION_AUTHORITY_PK_TERMINAL = 0x9F22,

  // Certification Authority Public Key Index (ICC)
  TAG_CERTIFICATION_AUTHORITY_PUBLIC_KEY_INDEX = 0x8F,

  // Command Template
  TAG_COMMAND_FORMAT = 0x83,

  // Cryptogram Information Data
  TAG_CRYPTOGRAM_INFORMATION_DATA = 0x9F27,

  // Cardholder Verification Method (CVM) List
  TAG_CVM_LIST = 0x8E,

  // Cardholder Verification Method (CVM) Results
  TAG_CVM_RESULTS = 0x9F34,

  // Data Authentication Code
  TAG_DATA_AUTHENTICATION_CODE = 0x9F45,

  // Dynamic Data Authentication Data Object List (DDOL)
  TAG_DDOL = 0x9F49,

  // Issuer Action Code - Default
  TAG_IAC_DEFAULT = 0x9F0D,

  // Issuer Action Code - Denial
  TAG_IAC_DENIAL = 0x9F0E,

  // Issuer Action Code - Online
  TAG_IAC_ONLINE = 0x9F0F,

  // ICC Dynamic Number
  TAG_ICC_DYNAMIC_NUMBER = 0x9F4C,

  // ICC Public Key Certificate
  TAG_ICC_PUBLIC_KEY_CERTIFICATE = 0x9F46,

  // ICC Public Key Exponent
  TAG_ICC_PUBLIC_KEY_EXPONENT = 0x9F47,

  // ICC Public Key Remainder
  TAG_ICC_PUBLIC_KEY_REMAINDER = 0x9F48,

  // Issuer Application Data
  TAG_ISSUER_APPLICATION_DATA = 0x9F10,

  // Issuer Authentication Data
  TAG_ISSUER_AUTHENTICATION_DATA = 0x91,


  // Issuer Public Key Certificate
  TAG_ISSUER_PUBLIC_KEY_CERTIFICATE = 0x90,

  // Issuer Public Key Exponent
  TAG_ISSUER_PUBLIC_KEY_EXPONENT = 0x9F32,

  // Issuer Public Key Remainder
  TAG_ISSUER_PUBLIC_KEY_REMAINDER = 0x92,

  // Issuer Script Command
  TAG_ISSUER_SCRIPT_COMMAND = 0x86,

  // Issuer Script Identifier
  TAG_ISSUER_SCRIPT_IDENTIFIER = 0x9F18,

  // Last Online ATC Register
  TAG_LATC = 0x9F13,

  // Lower Consective Offline Limite
  TAG_LOWER_CONSECUTIVE_OFFLINE_LIMIT = 0x9F14,

  // Processing Options Data Object List (PDOL)
  TAG_PDOL = 0x9F38,

  // ICC PIN Encipherment Public Key Certificate
  TAG_PIN_ENCIPHER_PUBLIC_KEY_CERTIFICATE = 0x9F2D,

  // ICC PIN Encipherment Public Key Exponent
  TAG_PIN_ENCIPHER_PUBLIC_KEY_EXPONENT = 0x9F2E,

  // ICC PIN Encipherment Public Key Remainder
  TAG_PIN_ENCIPHER_PUBLIC_KEY_REMAINDER = 0x9F2F,

  // Point-of-Service (POS) Entry Mode
  TAG_POS_ENTRY_MODE = 0x9F39,

  // PIN Try Counter
  TAG_PTC = 0x9F17,

  // Response Format 1 Primitive
  TAG_RESPONSE_FORMAT1_PRIMITIVE = 0x80,

  // Response Format 1 Template
  TAG_RESPONSE_FORMAT2_TEMPLATE = 0x77,

  // Issuer Script Template 1
  TAG_SCRIPT_TEMPLATE1 = 0x71,

  // Issuer Script Template 2
  TAG_SCRIPT_TEMPLATE2 = 0x72,

  // Static Data Authentication Tag List
  TAG_SDOL = 0x9F4A,

  // Signed Dynamic Applicatino Data
  TAG_SIGNED_DYNAMIC_APPLICATION_DATA = 0x9F4B,

  // Signed Static Applicatino Data
  TAG_SIGNED_STATIC_APPLICATION_DATA = 0x93,

  // Transaction Certificate (TC) Hash Value
  TAG_TCHASH = 0x98,

  // Transaction Certificate Data Object List (TDOL)
  TAG_TDOL = 0x97,

  // Acquirer Identifier
  TAG_TERMINAL_ACQUIRER_ID = 0x9F01,

  // Terminal Country Code
  TAG_TERMINAL_COUNTRY_CODE = 0x9F1A,

  // Terminal Floor Limit
  TAG_TERMINAL_FLOOR_LIMIT = 0x9F1B,

  // Terminal Identification
  TAG_TERMINAL_ID = 0x9F1C,

  // Interface Device (IFD) Serial Number
  TAG_TERMINAL_IFD_SERIALNUMBER = 0x9F1E,

  // Terminal Capabilities
  TAG_TERMINAL_CAPABILITIES = 0x9F33,

  // Terminal Sequence Number
  TAG_TERMINAL_SEQUENCE_NUMBER = 0x9F41,

  // Terminal Type
  TAG_TERMINAL_TYPE = 0x9F35,

  // Terminal Unpredictable Number
  TAG_TERMINAL_UNPREDICTABLE_NUMBER = 0x9F37,

  // Terminal Version Number
  TAG_TERMINAL_VERSION_NUMBER = 0x9F09,

  // Merchant Category Code
  TAG_TERMINAL_MERCHANT_CATEGORY_CODE = 0x9F15,

  // Merchante Identifier
  TAG_TERMINAL_MERCHANT_ID = 0x9F16,

  // Merchant Name and Location
  TAG_TERMINAL_MERCHANT_NAME_AND_LOCATION = 0x9F4E,

  // Terminal Risk Management Data
  TAG_TERMINAL_RISK_MANAGEMENT_DATA = 0x9F1D,

  // Track 1 Discretionary Data
  TAG_TRACK1_DISC_DATA = 0x9F1F,

  // Track 2 Discretionary Data
  TAG_TRACK2_DISC_DATA = 0x9F20,

  // Transaction Data
  TAG_TRANSACTION_DATE = 0x9A,

  // Transaction Personal Identification Number (PIN) Data
  TAG_TRANSACTION_PIN_DATA = 0x99,

  // Amount, Reference Currency
  TAG_TRANSACTION_REFERENCE_AMOUNT = 0x9F3A,

  // Transaction Reference Currency Code
  TAG_TRANSACTION_REFERENCE_CURRENCY = 0x9F3C,

  // Transaction Reference Currency Exponent
  TAG_TRANSACTION_REFERENCE_EXPONENT = 0x9F3d,

  // Transaction Time
  TAG_TRANSACTION_TIME = 0x9F21,

  // Transaction Type
  TAG_TRANSACTION_TYPE = 0x9C,

  // Transaction Status Information
  TAG_TSI = 0x9B,

  // Terminal Verification Results
  TAG_TVR = 0x95,

  // Upper Consecutive Offline Limit
  TAG_UPPER_CONSECUTIVE_OFFLINE_LIMIT = 0x9F23,

  SW_PIN_BLOCKED = 0x6983,    //< PIN blocked Status word

  CID_CRYPTOGRAM_TYPE_MASK = 0xC0,    //< Mask for Application Cryptogram Types, used to extract an AC from a byte variable.
  CID_AAC            = 0x00,    //< AAC (Application Authorization Cryptogram) - transaction was declined.
  CID_TC             = 0x40,    //< TC (Transaction Cryptogram) - transaction was approved off-line.
  CID_ARQC            = 0x80,    //< ARQC (Application Request Cryptogram) - transaction must be approved on-line.
  CID_AAR            = 0xC0,    //< AAR (Application Referral Cryptogramm) - ask for referral

  CID_ADVICE_REQUIRED_BIT  = 0x08,    //< Mask for Advice required
  CID_REASON_TYPE_MASK    = 0x07,    //< Mask for Reason/advice/referral code
  CID_REASON_SVC_NOT_ALLOWED  = 0x01,    //< Service not allowed
  CID_REASON_PTC_ZERO      = 0x02,    //< PIN try limit exceeded
}

// HRP-301 (VERDANT-1) serious adverse event cases as the safety database holds them, shaped after
// ICH E2B(R3), for the CSR & Narrative Studio (Narratives and SAE reconciliation accept this file).
// The PV Intake & Triage Console exports the same cases from its Study cases page.
// Fictional: the participants, events and assessments come from the CDM Query & Edit-Check
// Console's locked HRP-301 database and its reconciled safety cases.
export const TRIAL_CASES_FILE = {
 "format": "csr-studio/safety-cases",
 "schema": 1,
 "study": "HRP-301",
 "source": "Sponsor safety database: HRP-301 serious adverse event cases (E2B(R3)-shaped), fictional",
 "exported": "2026-11-21",
 "cases": [
  {
   "caseId": "HRP-2026-00141",
   "subj": "302-002",
   "term": "Herpes zoster",
   "onset": "2026-06-12",
   "end": "2026-06-24",
   "criteria": [
    "AESHOSP"
   ],
   "outcome": "RECOVERED/RESOLVED",
   "causality": "POSSIBLY RELATED",
   "sponsorCausality": "POSSIBLY RELATED",
   "action": "DRUG INTERRUPTED",
   "aware": "2026-06-12",
   "received": "2026-06-13",
   "usubjid": "HRP-301-302-002",
   "e2b": {
    "C.1.1 sender safety report unique identifier": "HRP-2026-00141",
    "C.1.3 type of report": "2 report from study",
    "C.1.4 date report first received": "2026-06-13",
    "C.1.5 date of most recent information": "2026-06-13",
    "C.5.1 study registration": "HRP-301 (VERDANT-1)",
    "C.5.4 study type": "1 clinical trials",
    "D.1 patient (study participant identifier)": "HRP-301-302-002",
    "D.2.2a age at onset": 58,
    "D.2.2b age unit": "year",
    "D.5 sex": "1 male",
    "E.i.1.1a reaction as reported": "Herpes zoster",
    "E.i.2.1b reaction (study medical dictionary preferred term)": "Herpes zoster",
    "E.i.3.2 seriousness": [
     "E.i.3.2c caused or prolonged hospitalisation"
    ],
    "E.i.4 date of start of reaction": "2026-06-12",
    "E.i.5 date of end of reaction": "2026-06-24",
    "E.i.7 outcome": "1 recovered/resolved",
    "G.k.1 characterisation of drug role": "1 suspect",
    "G.k.2.2 medicinal product as reported": "Blinded study drug (unblinded: Lumiravostat 25 mg)",
    "G.k.8 action taken with drug": "1 drug withdrawn (temporarily: interrupted, then resumed)",
    "G.k.9.i.2 assessments": [
     {
      "source": "investigator",
      "method": "global introspection",
      "result": "POSSIBLY RELATED"
     },
     {
      "source": "sponsor",
      "method": "global introspection",
      "result": "POSSIBLY RELATED"
     }
    ],
    "H.1 case narrative": "Participant HRP-301-302-002 (Lumiravostat 25 mg): herpes zoster (serious adverse event).\n\nA 58-year-old American Indian or Alaska Native man with a history of hand eczema, asthma and allergic nose inflammation was randomised to Lumiravostat 25 mg and took the first dose of Lumiravostat 25 mg once daily on Day 1. Concomitant medications at the onset of the event: salbutamol 100 ug; cetirizine 10 mg.\n\nOn Day 47, the participant reported herpes zoster (coded as herpes zoster). The event was severe and serious (required hospitalisation). It was treated with valaciclovir 1 g from Day 47 to Day 54. Laboratory values: neutrophils 1.6 10^9/L on Day 59 (reference range 1.8 to 7.5).\n\nAction taken: study drug was interrupted. Dechallenge: positive. Study drug was interrupted because of the event, and the event resolved on Day 59. (The dosing record holds the bottles dispensed at each visit, so the days of the interruption are not recorded.) Rechallenge: negative. Study drug was resumed (bottles were dispensed after the event), and the event did not come back.\n\nThe event resolved on Day 59. The investigator assessed the event as possibly related to study drug; the sponsor assessed it as possibly related.",
    "study day of onset": 47
   }
  },
  {
   "caseId": "HRP-2026-00143",
   "subj": "303-006",
   "term": "Cellulitis of hand",
   "onset": "2026-06-29",
   "end": "2026-07-06",
   "criteria": [
    "AESHOSP"
   ],
   "outcome": "RECOVERED/RESOLVED",
   "causality": "NOT RELATED",
   "sponsorCausality": "NOT RELATED",
   "action": "DOSE NOT CHANGED",
   "aware": "2026-06-29",
   "received": "2026-07-03",
   "usubjid": "HRP-301-303-006",
   "e2b": {
    "C.1.1 sender safety report unique identifier": "HRP-2026-00143",
    "C.1.3 type of report": "2 report from study",
    "C.1.4 date report first received": "2026-07-03",
    "C.1.5 date of most recent information": "2026-07-03",
    "C.5.1 study registration": "HRP-301 (VERDANT-1)",
    "C.5.4 study type": "1 clinical trials",
    "D.1 patient (study participant identifier)": "HRP-301-303-006",
    "D.2.2a age at onset": 55,
    "D.2.2b age unit": "year",
    "D.5 sex": "2 female",
    "E.i.1.1a reaction as reported": "Cellulitis of hand",
    "E.i.2.1b reaction (study medical dictionary preferred term)": "Cellulitis",
    "E.i.3.2 seriousness": [
     "E.i.3.2c caused or prolonged hospitalisation"
    ],
    "E.i.4 date of start of reaction": "2026-06-29",
    "E.i.5 date of end of reaction": "2026-07-06",
    "E.i.7 outcome": "1 recovered/resolved",
    "G.k.1 characterisation of drug role": "1 suspect",
    "G.k.2.2 medicinal product as reported": "Blinded study drug (unblinded: Lumiravostat 10 mg)",
    "G.k.8 action taken with drug": "4 dose not changed",
    "G.k.9.i.2 assessments": [
     {
      "source": "investigator",
      "method": "global introspection",
      "result": "NOT RELATED"
     },
     {
      "source": "sponsor",
      "method": "global introspection",
      "result": "NOT RELATED"
     }
    ],
    "H.1 case narrative": "Participant HRP-301-303-006 (Lumiravostat 10 mg): cellulitis (serious adverse event).\n\nA 55-year-old Asian woman with a history of appendix removal and hand eczema was randomised to Lumiravostat 10 mg and took the first dose of Lumiravostat 10 mg once daily on Day 1. Concomitant medications at the onset of the event: none.\n\nOn Day 38, the participant reported cellulitis of hand (coded as cellulitis). The event was moderate and serious (required hospitalisation). No treatment for the event was recorded.\n\nAction taken: the dose was not changed. Dechallenge: not applicable; the dose was not changed. Rechallenge: not applicable.\n\nThe event resolved on Day 45. The investigator assessed the event as not related to study drug; the sponsor assessed it as not related.",
    "study day of onset": 38
   }
  },
  {
   "caseId": "HRP-2026-00144",
   "subj": "301-007",
   "term": "Pneumonia",
   "onset": "2026-08-02",
   "end": "2026-08-11",
   "criteria": [
    "AESHOSP"
   ],
   "outcome": "RECOVERED/RESOLVED",
   "causality": "UNLIKELY RELATED",
   "sponsorCausality": "POSSIBLY RELATED",
   "action": "DRUG INTERRUPTED",
   "aware": "2026-08-02",
   "received": "2026-08-03",
   "usubjid": "HRP-301-301-007",
   "e2b": {
    "C.1.1 sender safety report unique identifier": "HRP-2026-00144",
    "C.1.3 type of report": "2 report from study",
    "C.1.4 date report first received": "2026-08-03",
    "C.1.5 date of most recent information": "2026-08-03",
    "C.5.1 study registration": "HRP-301 (VERDANT-1)",
    "C.5.4 study type": "1 clinical trials",
    "D.1 patient (study participant identifier)": "HRP-301-301-007",
    "D.2.2a age at onset": 51,
    "D.2.2b age unit": "year",
    "D.5 sex": "2 female",
    "E.i.1.1a reaction as reported": "Pneumonia",
    "E.i.2.1b reaction (study medical dictionary preferred term)": "Pneumonia",
    "E.i.3.2 seriousness": [
     "E.i.3.2c caused or prolonged hospitalisation"
    ],
    "E.i.4 date of start of reaction": "2026-08-02",
    "E.i.5 date of end of reaction": "2026-08-11",
    "E.i.7 outcome": "1 recovered/resolved",
    "G.k.1 characterisation of drug role": "1 suspect",
    "G.k.2.2 medicinal product as reported": "Blinded study drug (unblinded: placebo)",
    "G.k.8 action taken with drug": "1 drug withdrawn (temporarily: interrupted, then resumed)",
    "G.k.9.i.2 assessments": [
     {
      "source": "investigator",
      "method": "global introspection",
      "result": "UNLIKELY RELATED"
     },
     {
      "source": "sponsor",
      "method": "global introspection",
      "result": "POSSIBLY RELATED"
     }
    ],
    "H.1 case narrative": "Participant HRP-301-301-007 (Placebo): pneumonia (serious adverse event).\n\nA 51-year-old White woman with a history of atopic dermatitis and hand eczema was randomised to Placebo and took the first dose of placebo once daily on Day 1. Concomitant medications at the onset of the event: none.\n\nOn Day 66, the participant reported pneumonia (coded as pneumonia). The event was severe and serious (required hospitalisation). It was treated with amoxicillin + clavulanic acid 625 mg from Day 66 to Day 73.\n\nAction taken: study drug was interrupted. Dechallenge: positive. Study drug was interrupted because of the event, and the event resolved on Day 75. (The dosing record holds the bottles dispensed at each visit, so the days of the interruption are not recorded.) Rechallenge: negative. Study drug was resumed (bottles were dispensed after the event), and the event did not come back.\n\nThe event resolved on Day 75. The investigator assessed the event as unlikely to be related to study drug; the sponsor assessed it as possibly related.",
    "study day of onset": 66
   }
  },
  {
   "caseId": "HRP-2026-00900",
   "subj": "304-003",
   "term": "Wrist fracture",
   "onset": "2026-06-27",
   "end": "2026-08-01",
   "criteria": [
    "AESHOSP"
   ],
   "outcome": "RECOVERED/RESOLVED",
   "causality": "NOT RELATED",
   "sponsorCausality": "NOT RELATED",
   "action": "DOSE NOT CHANGED",
   "aware": "2026-06-27",
   "received": "2027-03-10",
   "usubjid": "HRP-301-304-003",
   "e2b": {
    "C.1.1 sender safety report unique identifier": "HRP-2026-00900",
    "C.1.3 type of report": "2 report from study",
    "C.1.4 date report first received": "2027-03-10",
    "C.1.5 date of most recent information": "2027-03-10",
    "C.5.1 study registration": "HRP-301 (VERDANT-1)",
    "C.5.4 study type": "1 clinical trials",
    "D.1 patient (study participant identifier)": "HRP-301-304-003",
    "D.2.2a age at onset": 35,
    "D.2.2b age unit": "year",
    "D.5 sex": "2 female",
    "E.i.1.1a reaction as reported": "Wrist fracture",
    "E.i.2.1b reaction (study medical dictionary preferred term)": "Wrist fracture",
    "E.i.3.2 seriousness": [
     "E.i.3.2c caused or prolonged hospitalisation"
    ],
    "E.i.4 date of start of reaction": "2026-06-27",
    "E.i.5 date of end of reaction": "2026-08-01",
    "E.i.7 outcome": "1 recovered/resolved",
    "G.k.1 characterisation of drug role": "1 suspect",
    "G.k.2.2 medicinal product as reported": "Blinded study drug (unblinded: Lumiravostat 25 mg)",
    "G.k.8 action taken with drug": "4 dose not changed",
    "G.k.9.i.2 assessments": [
     {
      "source": "investigator",
      "method": "global introspection",
      "result": "NOT RELATED"
     },
     {
      "source": "sponsor",
      "method": "global introspection",
      "result": "NOT RELATED"
     }
    ],
    "H.1 case narrative": "Participant HRP-301-304-003 (Lumiravostat 25 mg): wrist fracture (serious adverse event).\n\nA 35-year-old White woman with a history of hand eczema and underactive thyroid was randomised to Lumiravostat 25 mg and took the first dose of Lumiravostat 25 mg once daily on Day 1. Concomitant medications at the onset of the event: levothyroxine 75 ug.\n\nOn Day 30, the participant reported wrist fracture (coded as wrist fracture). The event was moderate and serious (required hospitalisation). No treatment for the event was recorded.\n\nAction taken: the dose was not changed. Dechallenge: not applicable; the dose was not changed. Rechallenge: not applicable.\n\nThe event resolved on Day 65. The investigator assessed the event as not related to study drug; the sponsor assessed it as not related.",
    "study day of onset": 30
   }
  }
 ],
 "reconciliation": [
  {
   "usubjid": "HRP-301-301-007",
   "term": "Pneumonia",
   "caseId": "HRP-2026-00144",
   "status": "agrees",
   "notes": []
  },
  {
   "usubjid": "HRP-301-302-002",
   "term": "Herpes zoster",
   "caseId": "HRP-2026-00141",
   "status": "agrees",
   "notes": []
  },
  {
   "usubjid": "HRP-301-303-006",
   "term": "Cellulitis",
   "caseId": "HRP-2026-00143",
   "status": "agrees",
   "notes": []
  },
  {
   "usubjid": "HRP-301-304-003",
   "term": "Wrist fracture",
   "caseId": "HRP-2026-00900",
   "status": "agrees",
   "notes": []
  }
 ]
} as const

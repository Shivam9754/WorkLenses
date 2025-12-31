
import { FileItem, AppSource } from '../types';

const MOCK_FILES: Record<AppSource, FileItem[]> = {
  gmail: [
    { 
      id: 'gm1', 
      name: 'Contract Negotiation Final.eml', 
      size: '45 KB', 
      type: 'email', 
      source: 'gmail', 
      contentSnippet: 'Re: Master Services Agreement. Please find the latest revisions attached for Joe. The following terms have been updated: Section 4.2 regarding liability caps, Section 7.1 regarding intellectual property ownership, and the termination notice period has been extended from 30 to 60 days to align with enterprise standards. Please review the redlines.' 
    },
    { 
      id: 'gm2', 
      name: 'Termination Clause Query.eml', 
      size: '12 KB', 
      type: 'email', 
      source: 'gmail', 
      contentSnippet: 'We have concerns regarding Section 4.2 of the NDAs. The specific wording around "consequential damages" remains ambiguous and could expose the firm to unnecessary litigation risks in the event of a minor data breach. Our legal team suggests replacing the entire paragraph with the standard ISO-certified protection clause.' 
    },
    { 
      id: 'gm3', 
      name: 'Board Resolution - Q3.eml', 
      size: '2.1 MB', 
      type: 'email', 
      source: 'gmail', 
      contentSnippet: 'Unanimous consent for the acquisition of Alpha Corp. The board has reviewed the due diligence reports, environmental impact studies, and financial audits. By a vote of 12-0, the resolution to proceed with the $45M cash-and-stock merger is hereby ratified, effective as of the upcoming fiscal quarter close.' 
    }
  ],
  gdrive: [
    { 
      id: 'gd1', 
      name: 'MSA_v4_Draft.pdf', 
      size: '1.2 MB', 
      type: 'pdf', 
      source: 'gdrive', 
      contentSnippet: 'Standard Master Services Agreement terms with 30-day net payment. This document outlines the framework for all future Statement of Works (SOWs) and establishes the primary relationship between the vendor and the client, including dispute resolution mechanisms and confidentiality requirements for all sub-contractors.' 
    },
    { 
      id: 'gd2', 
      name: 'Commercials_2024.xlsx', 
      size: '890 KB', 
      type: 'spreadsheet', 
      source: 'gdrive', 
      contentSnippet: 'Revenue projections and discount schedules for top-tier clients. The spreadsheet contains detailed pivot tables showing the margin impact of volume-based tiering. We expect a 12% increase in recurring revenue if the proposed bundle pricing is adopted across the EMEA and APAC regions by the end of Q2.' 
    },
    { 
      id: 'gd3', 
      name: 'Product_Roadmap_Q4.pdf', 
      size: '4.5 MB', 
      type: 'pdf', 
      source: 'gdrive', 
      contentSnippet: 'Confidential product vision and competitive analysis. Key milestones include the integration of decentralized identity protocols, the launch of the mobile SDK for cross-platform deal tracking, and the deprecation of legacy XML parsing modules in favor of the new high-performance JSON-LD streaming API.' 
    }
  ],
  dropbox: [
    { 
      id: 'db1', 
      name: 'Project_Alpha_Blueprint.zip', 
      size: '150 MB', 
      type: 'archive', 
      source: 'dropbox', 
      contentSnippet: 'Technical specifications and architectural diagrams. Contains high-level design documents for the microservices mesh, the database schema migration scripts, and the Kubernetes orchestration YAML files. Includes the security hardening guide for the production load balancers.' 
    },
    { 
      id: 'db2', 
      name: 'Legal_Review_Notes.docx', 
      size: '34 KB', 
      type: 'doc', 
      source: 'dropbox', 
      contentSnippet: 'Notes from the meeting with Legal counsel on Oct 12. Discussed the implications of new regional data privacy laws. We must implement end-to-end encryption for all stored deal artifacts and ensure that the auditing logs are immutable and stored in a separate, air-gapped security zone.' 
    },
    { 
      id: 'db3', 
      name: 'Vendor_Agreement_Template.docx', 
      size: '28 KB', 
      type: 'doc', 
      source: 'dropbox', 
      contentSnippet: 'Standard vendor onboarding documentation. All new partners must complete the cybersecurity assessment and provide proof of professional liability insurance. This template includes the revised Force Majeure clause that accounts for global supply chain disruptions and digital infrastructure failures.' 
    }
  ]
};

export const fetchFiles = async (source: AppSource): Promise<FileItem[]> => {
  await new Promise(resolve => setTimeout(resolve, 800));
  return MOCK_FILES[source];
};

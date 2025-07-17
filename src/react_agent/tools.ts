/**
 * This file defines the tools available to the ReAct agent.
 * Tools are functions that the agent can use to interact with external systems or perform specific tasks.
 */
import { TavilySearchResults } from "@langchain/community/tools/tavily_search";
import { DynamicStructuredTool, tool } from "@langchain/core/tools";
import { z } from "zod";
import { createEnsSepoliaDeploymentWithMetaMask } from "./sepolia_ENS.js";
/**
 * Tavily search tool configuration
 * This tool allows the agent to perform web searches using the Tavily API.
 */

const ngrok_url = 'https://5c6ec9b92527.ngrok-free.app'

const tavilySearch = new TavilySearchResults({
  maxResults: 3,
});

var companyName = "";

const searchTavily = new DynamicStructuredTool({
  name: "tavily_search_results_json",
  description: tavilySearch.description,
  schema: z.object({
    input: z
      .string()
      .nullable()
      .default(null)
      .describe("The search query for Tavily."),
  }),
  func: async ({ input }) => {
    return tavilySearch.call({ input: input ?? "" });
  },
});

const adderSchema = z.object({
  a: z.number(),
  b: z.number(),
});

const adderTool = tool(
  async (input): Promise<string> => {
    const sum = input.a + input.b;
    return `The sum of ${input.a} and ${input.b} is ${sum}`;
  },
  {
    name: "adder",
    description: "Adds two numbers together",
    schema: adderSchema,
  }
);

const StateRegisterSchema = z.object({
  companyname: z.string(),
  idnumer: z.string(),
  status: z.string(),
  form: z.string(),
  formationdate: z.string(),
  state: z.string(),
  locationaddress: z.string(),
  website: z.string(),
  description: z.string()
});

const stateRegisterTool = tool(
  async (input): Promise<string> => {
    try {
    
      const response = await fetch(
        `${ngrok_url}/creds/good-standing/company?company=${input.companyname}&state=${input.state}`
      );

      if (!response.ok) {
        const text = await response.text();
        console.error("Fetch failed:", response.status, text);
        return `Fetch failed: ${response.status} - ${text}`;
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error during fetch:", error);
      if (error instanceof Error) {
        return `Error during fetch: ${error.message}`;
      }
      return "An unknown error occurred during fetch.";
    }
  },
  {
    name: "state_register",
    description: "Get the info of the company that is registered in the state",
    schema: StateRegisterSchema,
  }
);

const DomainVerificationSchema = z.object({
  domain: z.string(),
});

const DomainVerificationTool = tool(
  async (input): Promise<string> => {
    const response = await fetch(
      `${ngrok_url}/creds/good-standing/domain?domain=${input.domain}`
    );
    const data = await response.json();
    return data;
  },
  {
    name: "domain_verification",
    description: "Verify the domain of a company",
    schema: DomainVerificationSchema,
  }
);

const websiteVerificationSchema = z.object({
  website: z.string(),
  formdate: z.string(),
});

const websiteVerificationTool = tool(
  async (input): Promise<string> => {
    try {  
      const response = await fetch(
        `${ngrok_url}/creds/good-standing/website?website=${input.website}`
      );
      
      if (!response.ok) {
        const text = await response.text();
        console.error("Fetch failed:", response.status, text);
        return `Fetch failed: ${response.status} - ${text}`;
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error during fetch:", error);
      if (error instanceof Error) {
        return `Error during fetch: ${error.message}`;
      }
      return "An unknown error occurred during fetch.";
    }
  },
  {
    name: "website_verification",
    description: "Verify the website of a company",
    schema: websiteVerificationSchema,
  }
);

const emailVerificationSchema = z.object({
  email: z.string(),
  companyname: z.string(),
  state: z.string(),
});

const emailVerificationTool = tool(
  async (input): Promise<string> => {
    const response = await fetch(
      `${ngrok_url}/creds/good-standing/domain?domain=${input.email}`
    );
    const data = await response.json();
    return data;
  },
  {
    name: "email_verification",
    description: "Verify the email of a company",
    schema: emailVerificationSchema,
  }
);

const companyNameSchema = z.object({
  companyname: z.string(),
});

const companyNameTool = tool(
  async (input): Promise<string> => {
    companyName = input.companyname;
    return input.companyname;
  },
  {
    name: "company_name",
    description: "Get the name of the company",
    schema: companyNameSchema,
  }
);

const linkedinVerificationSchema = z.object({
  linkedin: z.string()
});

const linkedinVerificationTool = tool(
  async (input): Promise<string> => {
    const response = input.linkedin;
    return 'linkedin';
  },
  {
    name: "linkedin_verification",
    description: "Verify the LinkedIn profile of a user",
    schema: linkedinVerificationSchema,
  }
)

const ensVerificationSchema = z.object({
  domain: z.string(),
  signer: z.string(),
});

const ensRegistrationTool = tool(
  async (input): Promise<string> => {
    const ens_domain = input.domain;
    const ens_signer = input.signer;
    const rslt = await createEnsSepoliaDeploymentWithMetaMask(ens_domain, ens_signer);
    return rslt;
  },
  {
    name: "ens_registration",
    description: 'register an ens domain',
    schema: ensVerificationSchema,
  }
)

/**
 * Export an array of all available tools
 * Add new tools to this array to make them available to the agent
 *
 * Note: You can create custom tools by implementing the Tool interface from @langchain/core/tools
 * and add them to this array.
 * See https://js.langchain.com/docs/how_to/custom_tools/#tool-function for more information.
 */

export const TOOLS = [
  searchTavily,
  adderTool, 
  stateRegisterTool, 
  websiteVerificationTool, 
  DomainVerificationTool, 
  emailVerificationTool, 
  companyNameTool, 
  linkedinVerificationTool,
  ensRegistrationTool,
];

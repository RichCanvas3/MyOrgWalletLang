/**
 * This file defines the tools available to the ReAct agent.
 * Tools are functions that the agent can use to interact with external systems or perform specific tasks.
 */
import { TavilySearchResults } from "@langchain/community/tools/tavily_search";
import { DynamicStructuredTool, tool } from "@langchain/core/tools";
import { z } from "zod";

/*
 * Tavily search tool configuration
 * This tool allows the agent to perform web searches using the Tavily API.
 */

const ngrok_url = 'https://5c6ec9b92527.ngrok-free.app'

const tavilySearch = new TavilySearchResults({
  maxResults: 3,
});



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
  state: z.string(),
});

const stateRegisterTool = tool(
  async (input): Promise<string> => {
    return input.name, input.state;
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
    return 'domain_verification';
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
    return 'website_verification'
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
    return 'email_verification';
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
    return 'linkedin_verification';
  },
  {
    name: "linkedin_verification",
    description: "Verify the LinkedIn profile of a user",
    schema: linkedinVerificationSchema,
  }
);

const ensVerificationSchema = z.object({
  domain: z.string(),
});

const ensRegistrationTool = tool(
  async (input): Promise<string> => {
    return 'ens_verification';
  },
  {
    name: "ens_registration",
    description: 'register an ens domain',
    schema: ensVerificationSchema,
  }
);

const insuranceSchema = z.object({
  insurance: z.string(),
});

const insuranceTool = tool(
  async (input): Promise<string> => {
    return 'insurance_verification';
  },
  {
    name: "insurance_verifcation",
    description: 'verify insurance',
    schema: insuranceSchema,
  }
);

const shopifySchema = z.object({
  shopify: z.string(),
});

const shopifyTool = tool(
  async (input): Promise<string> => {
    return 'shopify_verification';
  },
  {
    name: "shopify_verification",
    description: 'verify shopify',
    schema: shopifySchema,
  }
);

const xSchema = z.object({
  x: z.string(),
});

const xTool = tool(
  async (input): Promise<string> => {
    return 'x_verification';
  },
  {
    name: "x_verification",
    description: 'verify x and/or twitter',
    schema: xSchema,
  }
);

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
  linkedinVerificationTool,
  ensRegistrationTool,
  shopifyTool,
  insuranceTool,
  xTool
];

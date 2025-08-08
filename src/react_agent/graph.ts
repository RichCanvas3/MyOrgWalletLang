// npx @langchain/langgraph-cli@latest dev

import { AIMessage } from "@langchain/core/messages";
import { RunnableConfig } from "@langchain/core/runnables";
import { MessagesAnnotation, StateGraph } from "@langchain/langgraph";
import { ToolNode } from "@langchain/langgraph/prebuilt";

import { ConfigurationSchema, ensureConfiguration } from "./configuration.js";
import { TOOLS } from "./tools.js";
import { loadChatModel } from "./utils.js";
/*
// Utility: Load attestations from DB or API
async function loadUserAttestations(userId: string): Promise<any> {
  let state_registration = null;
  let ens = null;
  let linkedin = null;
  let x = null;
  let insurance = null;
  let website = null;
  let shopify = null;
  let email = null;
  let domain = null;
  try {
    const entities:any[] = []//insert api call here
    for (const entity of entities) {
      if (entity.name == "domain(org)") {
        domain = true
      } else if (entity.name == "ens(org)") {
        ens = true
      } else if (entity.name == 'linkedin(indiv)') {
        linkedin = true
      } else if (entity.name == 'x(indiv)') {
        x = true
      } else if (entity.name == 'insurance(org)') {
        insurance = true
      } else if (entity.name == 'website(org)') {
        website = true
      } else if (entity.name == 'shopify(org)') {
        shopify = true
      } else if (entity.name == 'email(indiv)') {
        email = true
      } else if (entity.name == 'state-registration(org)') {
        state_registration = true
      }
    }
    // TODO: Replace with your actual DB/API call using userId
    // MOCK: Example with no core attestations
    return {
      state_registration: state_registration,
      ens_domain: ens,
      linkedin_verification: linkedin,
      shopify_verification: shopify,
      insurance_verification: insurance,
      x_verification: x,
      domain_verification: domain,
      website_verification: website,
      email_verification: email,
    };
  } catch (err) {
    console.error("Error loading attestations:", err);
    return {}; // Don't block system on failure
  }
}

// 🔄 Initialization Node: Load attestation data
async function initializeAttestations(
  state: typeof MessagesAnnotation.State,
  config: RunnableConfig,
): Promise<typeof MessagesAnnotation.Update> {
  const userId = config?.configurable?.userId ?? "anonymous";

  // Avoid re-injecting attestation data
  const alreadyHasAttestation = state.messages.some(
    (msg) =>
      msg.role === "system" &&
      typeof msg.content === "string" &&
      msg.content.startsWith("__ATTESTATION_DATA__")
  );

  if (alreadyHasAttestation) return {};

  const attestations = await loadUserAttestations(userId);

  const attestationMessage = {
    role: "system" as const,
    content: `__ATTESTATION_DATA__ ${JSON.stringify(attestations)}`
  };

  // Remove placeholder user messages like "lets get started: name: ..."
  const filteredMessages = state.messages.filter(
    (msg) =>
      !(msg.role === "user" &&
        typeof msg.content === "string" &&
        msg.content.startsWith("lets get started: name:"))
  );

  return { messages: [...filteredMessages, attestationMessage] };
}
*/

// 🧠 LLM Node: Call your model with system prompt + messages
async function callModel(
  state: typeof MessagesAnnotation.State,
  config: RunnableConfig,
): Promise<typeof MessagesAnnotation.Update> {
  const configuration = ensureConfiguration(config);
  const model = (await loadChatModel(configuration.model)).bindTools(TOOLS);

  const response = await model.invoke([
    {
      role: "system",
      content: configuration.systemPromptTemplate.replace(
        "{system_time}",
        new Date().toISOString(),
      ),
    },
    ...state.messages,
  ]);

  return { messages: [response] };
}

// 🔀 Router Node: Decide next step
function routeModelOutput(state: typeof MessagesAnnotation.State): string {
  const lastMessage = state.messages[state.messages.length - 1];
  if ((lastMessage as AIMessage)?.tool_calls?.length > 0) {
    return "tools";
  }
  return "__end__";
}

// 🧠 Create the Graph
const workflow = new StateGraph(MessagesAnnotation, ConfigurationSchema)
  //.addNode("initialize", initializeAttestations)
  .addNode("callModel", callModel)
  .addNode("tools", new ToolNode(TOOLS))
  //.addEdge("__start__", "initialize")
  //.addEdge("initialize", "callModel")
  .addEdge("__start__", "callModel")
  .addConditionalEdges("callModel", routeModelOutput)
  .addEdge("tools", "callModel");

// 🚀 Compile
export const graph = workflow.compile({
  interruptBefore: [],
  interruptAfter: [],
});

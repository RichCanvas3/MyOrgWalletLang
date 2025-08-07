// npx @langchain/langgraph-cli@latest dev

import { AIMessage } from "@langchain/core/messages";
import { RunnableConfig } from "@langchain/core/runnables";
import { MessagesAnnotation, StateGraph } from "@langchain/langgraph";
import { ToolNode } from "@langchain/langgraph/prebuilt";

import { ConfigurationSchema, ensureConfiguration } from "./configuration.js";
import { TOOLS } from "./tools.js";
import { loadChatModel } from "./utils.js";

// Utility: Load attestations from DB or API
async function loadUserAttestations(userId: string): Promise<any> {
  try {
    // TODO: Replace with your actual DB/API call using userId
    // MOCK: Example with no core attestations
    return {
      state_registration: null,
      ens_domain: null,
      linkedin_verification: null,
      shopify_verification: null,
      insurance_verification: null,
      x_verification: null,
      domain_verification: null,
      website_verification: null,
      email_verification: null,
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
  .addNode("initialize", initializeAttestations)
  .addNode("callModel", callModel)
  .addNode("tools", new ToolNode(TOOLS))
  .addEdge("__start__", "initialize")
  .addEdge("initialize", "callModel")
  .addConditionalEdges("callModel", routeModelOutput)
  .addEdge("tools", "callModel");

// 🚀 Compile
export const graph = workflow.compile({
  interruptBefore: [],
  interruptAfter: [],
});

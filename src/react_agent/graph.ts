//npx @langchain/langgraph-cli@latest dev

import { AIMessage } from "@langchain/core/messages";
import { RunnableConfig } from "@langchain/core/runnables";
import { MessagesAnnotation, StateGraph } from "@langchain/langgraph";
import { ToolNode } from "@langchain/langgraph/prebuilt";

import { ConfigurationSchema, ensureConfiguration } from "./configuration.js";
import { TOOLS } from "./tools.js";
import { loadChatModel } from "./utils.js";

// Define the initialization function that loads attestations
async function initializeAttestations(
  state: typeof MessagesAnnotation.State,
  config: RunnableConfig,
): Promise<typeof MessagesAnnotation.Update> {
  // TODO: Replace this with your actual attestation loading logic
  // This is where you would fetch attestations from your database/API
  const attestations = await loadUserAttestations(state.messages[0]?.content || "");

  // Add attestation data as a system message
  const attestationMessage = {
    role: "system" as const,
    content: `Current attestation data: ${JSON.stringify(attestations)}`
  };

  return { messages: [attestationMessage] };
}

// Placeholder function - replace with your actual attestation loading logic
async function loadUserAttestations(userMessage: string): Promise<any> {
  try {
    // This is where you would:
    // 1. Extract user ID from the message or context
    // 2. Query your database/API for existing attestations
    // 3. Return the attestation data

    // Example implementation:
    // const userId = extractUserIdFromMessage(userMessage);
    // const attestations = await database.queryAttestations(userId);

    // For now, return empty object - replace with actual implementation
    // You would typically query your database here:
    // const attestations = await db.attestations.findMany({
    //   where: { userId: userId },
    //   select: { type: true, verified: true, data: true }
    // });

    // TEMPORARY: Return mock data to test the functionality
    // Replace this with your actual database query
    //
    // SCENARIO 1: All three core attestations present (should say "What else can I help you with today?")
    // return {
    //   state_registration: {
    //     verified: true,
    //     data: {
    //       company_name: "Chipotle",
    //       state: "California",
    //       registration_date: "2024-01-15",
    //       status: "active"
    //     }
    //   },
    //   ens_domain: {
    //     verified: true,
    //     data: {
    //       domain: "chipotle.eth",
    //       registration_date: "2024-02-01",
    //       status: "active"
    //     }
    //   },
    //   linkedin_verification: {
    //     verified: true,
    //     data: {
    //       profile_url: "https://linkedin.com/in/chipotle",
    //       verification_date: "2024-01-20",
    //       status: "verified"
    //     }
    //   },
    //   shopify_verification: null,
    //   insurance_verification: null,
    //   x_verification: null,
    //   domain_verification: null,
    //   website_verification: null,
    //   email_verification: null,
    //   // Add other attestation types as needed
    // };

    // SCENARIO 2: Missing all core attestations (current reality - should ask about them)
    return {
      state_registration: null, // Missing state registration
      ens_domain: null, // Missing ENS
      linkedin_verification: null, // Missing LinkedIn
      shopify_verification: null,
      insurance_verification: null,
      x_verification: null,
      domain_verification: null,
      website_verification: null,
      email_verification: null,
      // Add other attestation types as needed
    };
  } catch (error) {
    console.error('Error loading attestations:', error);
    // Return empty attestations on error to prevent blocking
    return {};
  }
}

// Define the function that calls the model
async function callModel(
  state: typeof MessagesAnnotation.State,
  config: RunnableConfig,
): Promise<typeof MessagesAnnotation.Update> {
  /** Call the LLM powering our agent. **/
  const configuration = ensureConfiguration(config);

  // Feel free to customize the prompt, model, and other logic!
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

  // We return a list, because this will get added to the existing list
  return { messages: [response] };
}

// Define the function that determines whether to continue or not
function routeModelOutput(state: typeof MessagesAnnotation.State): string {
  const messages = state.messages;
  const lastMessage = messages[messages.length - 1];
  // If the LLM is invoking tools, route there.
  if ((lastMessage as AIMessage)?.tool_calls?.length || 0 > 0) {
    return "tools";
  }
  // Otherwise end the graph.
  else {
    return "__end__";
  }
}

// Define a new graph. We use the prebuilt MessagesAnnotation to define state:
// https://langchain-ai.github.io/langgraphjs/concepts/low_level/#messagesannotation
const workflow = new StateGraph(MessagesAnnotation, ConfigurationSchema)
  // Define the nodes we will cycle between
  .addNode("initialize", initializeAttestations)
  .addNode("callModel", callModel)
  .addNode("tools", new ToolNode(TOOLS))
  // Set the entrypoint as `initialize`
  // This means that this node is the first one called
  .addEdge("__start__", "initialize")
  .addEdge("initialize", "callModel")
  .addConditionalEdges(
    // First, we define the edges' source node. We use `callModel`.
    // This means these are the edges taken after the `callModel` node is called.
    "callModel",
    // Next, we pass in the function that will determine the sink node(s), which
    // will be called after the source node is called.
    routeModelOutput,
  )
  // This means that after `tools` is called, `callModel` node is called next.
  .addEdge("tools", "callModel");

// Finally, we compile it!
// This compiles it into a graph you can invoke and deploy.
export const graph = workflow.compile({
  interruptBefore: [], // if you want to update the state before calling the tools
  interruptAfter: [],
});

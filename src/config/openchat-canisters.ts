/**
 * Official OpenChat Canister IDs
 * 
 * These are the real canister IDs from the OpenChat platform
 * Source: OpenChat deployment configuration
 */

export interface OpenChatCanisters {
  // Core service canisters
  user_index: string;           // User management
  group_index: string;          // Group management  
  local_user_index: string;     // Local user services
  local_group_index: string;    // Local group services
  notifications: string;        // Push notifications
  notifications_index: string;  // Notification indexing
  online_users: string;         // Online status
  storage_index: string;        // File storage
  
  // Authentication & Identity
  identity: string;             // Identity management
  sign_in_with_email: string;   // Email authentication
  sign_in_with_ethereum: string; // Ethereum authentication
  sign_in_with_solana: string;  // Solana authentication
  
  // Bot services
  airdrop_bot: string;          // Airdrop functionality
  proposals_bot: string;        // Governance proposals
  
  // Infrastructure
  website: string;              // Main website
  registry: string;             // Service registry
  event_relay: string;          // Event distribution
  event_store: string;          // Event storage
  cycles_dispenser: string;     // Cycles management
  
  // SNS (Service Nervous System)
  sns_governance: string;       // Governance
  sns_ledger: string;          // Token ledger
  sns_root: string;            // Root canister
  sns_swap: string;            // Token swap
  sns_index: string;           // SNS indexing
  
  // Other services
  escrow: string;              // Escrow services
  market_maker: string;        // Market making
  neuron_controller: string;   // Neuron management
  treasury: string;            // Treasury management
  translations: string;        // Internationalization
  openchat_installer: string; // Installation service
  proposal_validation: string; // Proposal validation
}

/**
 * Production OpenChat Canister IDs (IC Mainnet)
 */
export const OPENCHAT_PRODUCTION_CANISTERS: OpenChatCanisters = {
  // Core services
  user_index: "4bkt6-4aaaa-aaaaf-aaaiq-cai",
  group_index: "4ijyc-kiaaa-aaaaf-aaaja-cai",
  local_user_index: "nq4qv-wqaaa-aaaaf-bhdgq-cai",
  local_group_index: "suaf3-hqaaa-aaaaf-bfyoa-cai",
  notifications: "dobi3-tyaaa-aaaaf-adnna-cai",
  notifications_index: "4glvk-ryaaa-aaaaf-aaaia-cai",
  online_users: "3vlw6-fiaaa-aaaaf-aaa3a-cai",
  storage_index: "rturd-qaaaa-aaaaf-aabaq-cai",
  
  // Authentication & Identity
  identity: "6klfq-niaaa-aaaar-qadbq-cai",
  sign_in_with_email: "zi2i7-nqaaa-aaaar-qaemq-cai",
  sign_in_with_ethereum: "2notu-qyaaa-aaaar-qaeha-cai",
  sign_in_with_solana: "2kpva-5aaaa-aaaar-qaehq-cai",
  
  // Bot services
  airdrop_bot: "62rh2-kiaaa-aaaaf-bmy5q-cai",
  proposals_bot: "iywa7-ayaaa-aaaaf-aemga-cai",
  
  // Infrastructure
  website: "6hsbt-vqaaa-aaaaf-aaafq-cai",
  registry: "cpi5u-yiaaa-aaaar-aqw5a-cai",
  event_relay: "6ofpc-2aaaa-aaaaf-biibq-cai",
  event_store: "64dy3-wqaaa-aaaaf-biicq-cai",
  cycles_dispenser: "gonut-hqaaa-aaaaf-aby7a-cai",
  
  // SNS
  sns_governance: "2jvtu-yqaaa-aaaaq-aaama-cai",
  sns_ledger: "2ouva-viaaa-aaaaq-aaamq-cai",
  sns_root: "3e3x2-xyaaa-aaaaq-aaalq-cai",
  sns_swap: "2hx64-daaaa-aaaaq-aaana-cai",
  sns_index: "2awyi-oyaaa-aaaaq-aaanq-cai",
  
  // Other services
  escrow: "s4yi7-yiaaa-aaaar-qacpq-cai",
  market_maker: "r2pvs-tyaaa-aaaar-ajcwq-cai",
  neuron_controller: "tktqu-nyaaa-aaaar-qackq-cai",
  treasury: "nafek-diaaa-aaaar-qalxa-cai",
  translations: "lxq5i-mqaaa-aaaaf-bih7q-cai",
  openchat_installer: "jodzs-iqaaa-aaaar-qamqa-cai",
  proposal_validation: "wkype-7qaaa-aaaar-ajfyq-cai",
};

/**
 * Test OpenChat Canister IDs (IC Test Network)
 */
export const OPENCHAT_TEST_CANISTERS: OpenChatCanisters = {
  // Core services
  user_index: "7njde-waaaa-aaaaf-ab2ca-cai",
  group_index: "7kifq-3yaaa-aaaaf-ab2cq-cai",
  local_user_index: "pecvb-tqaaa-aaaaf-bhdiq-cai",
  local_group_index: "sbhuw-gyaaa-aaaaf-bfynq-cai",
  notifications: "dhcdh-fqaaa-aaaaf-adnmq-cai",
  notifications_index: "7ekiy-aiaaa-aaaaf-ab2dq-cai",
  online_users: "7dlom-nqaaa-aaaaf-ab2da-cai",
  storage_index: "6jemw-paaaa-aaaaf-ab2ea-cai",
  
  // Authentication & Identity
  identity: "rejcv-jqaaa-aaaak-afj5q-cai",
  sign_in_with_email: "rubs2-eaaaa-aaaaf-bijfq-cai",
  sign_in_with_ethereum: "4s357-zaaaa-aaaaf-bjz7q-cai",
  sign_in_with_solana: "lix6w-ciaaa-aaaaf-bj2aa-cai",
  
  // Bot services
  airdrop_bot: "6pwwx-laaaa-aaaaf-bmy6a-cai",
  proposals_bot: "qu3kn-6qaaa-aaaaf-ahn7q-cai",
  
  // Infrastructure
  website: "pfs7b-iqaaa-aaaaf-abs7q-cai",
  registry: "cglwi-oaaaa-aaaar-aqw4q-cai",
  event_relay: "6jejw-xyaaa-aaaaf-biiba-cai",
  event_store: "63c6p-3iaaa-aaaaf-biica-cai",
  cycles_dispenser: "mq2tp-baaaa-aaaaf-aucva-cai",
  
  // SNS
  sns_governance: "t5cdl-3iaaa-aaaak-qbumq-cai",
  sns_ledger: "ttaod-ayaaa-aaaak-qbunq-cai",
  sns_root: "tgh7o-bqaaa-aaaak-qbuoa-cai",
  sns_swap: "tbgz2-miaaa-aaaak-qbuoq-cai",
  sns_index: "tubix-naaaa-aaaak-qbuna-cai",
  
  // Other services
  escrow: "tspqt-xaaaa-aaaal-qcnna-cai",
  market_maker: "6qpog-pyaaa-aaaar-aikyq-cai",
  neuron_controller: "tdq3i-3qaaa-aaaar-qacla-cai",
  treasury: "", // Not available in test
  translations: "lqr34-biaaa-aaaaf-bih7a-cai",
  openchat_installer: "xeg2u-baaaa-aaaaf-bscyq-cai",
  proposal_validation: "", // Not available in test
};

/**
 * Get canister IDs for specific environment
 */
export function getOpenChatCanisters(environment: 'production' | 'test' = 'production'): OpenChatCanisters {
  return environment === 'production' ? OPENCHAT_PRODUCTION_CANISTERS : OPENCHAT_TEST_CANISTERS;
}

/**
 * Get the most appropriate canister for messaging functionality
 */
export function getMessagingCanister(environment: 'production' | 'test' = 'production'): string {
  const canisters = getOpenChatCanisters(environment);
  // For messaging, we'll primarily use the user_index canister
  return canisters.user_index;
}

/**
 * Get the most appropriate canister for group functionality
 */
export function getGroupCanister(environment: 'production' | 'test' = 'production'): string {
  const canisters = getOpenChatCanisters(environment);
  // For groups, we'll use the group_index canister
  return canisters.group_index;
}
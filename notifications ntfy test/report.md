# ntfy Security Risk Assessment Report

## 🔔 Overview

ntfy is a simple HTTP-based pub-sub notification service that allows sending push notifications via HTTP PUT/POST requests. According to the [official documentation](https://docs.ntfy.sh/), ntfy follows a topic-based messaging system where users can subscribe to topics and receive messages in real-time.

**Critical Security Warning**: By default, when launched without proper authentication and persistence configuration, ntfy runs in a completely open and unprotected state:

- **Anyone can freely create topics, send notifications, and subscribe** without any authentication
- **No user login or secret required** — anyone who knows (or guesses) a topic name gets full read & write permission
- **Topics are auto-created on demand** with no access control
- **Messages held in memory only** for up to 12 hours by default
- **No message persistence** without proper cache-file configuration

## ✅ Executive Summary: Why This Setup is Critically Risky

| 🔍 Risk Area | Default Behavior | Security Consequence |
|---------------|------------------|---------------------|
| **Public Topics** | Anyone can create/access any topic | Complete lack of access control, eavesdropping |
| **Unlimited Access** | All clients get full read/write by default | No isolation between users or applications |
| **No Persistence** | Messages stored only in memory, lost on restart | Unreliable delivery, no audit trail |
| **No Authentication** | Zero user verification or token validation | Impersonation, unauthorized access |
| **No Monitoring** | Minimal logging without persistent storage | No visibility into usage or abuse |
| **Topic Collision** | Predictable topic names are easily guessable | Accidental or malicious topic hijacking |

## 🛑 Detailed Security Risks & Real-World Impact

### 1. 🎯 Zero Access Control — Completely Open System

As noted in the [ntfy documentation](https://docs.ntfy.sh/), **topic names are public, so it's wise to choose something that cannot be guessed easily**. However, this guidance highlights a fundamental security flaw:

**Critical Issues:**
- Topics auto-create without any permission checks
- No concept of topic ownership or access control lists
- Anyone with network access can read/write to any topic
- No way to revoke access or change permissions retroactively

**Real-world impact:**
- Attackers can intercept sensitive notifications by guessing topic names
- Malicious actors can spam legitimate topics with false alerts
- No protection against denial-of-service attacks via topic flooding

### 2. 💾 No Message Durability — Memory-Only Storage

Without configuring persistent storage (`cache-file`), ntfy operates as a volatile messaging system:

**Consequences:**
- All message history lost during service restarts
- Offline subscribers miss notifications permanently
- No audit trail for compliance or forensic analysis
- Scheduled notifications (`X-Delay` header) are lost on restart
- Business-critical alerts may never reach their destination

### 3. 👥 No User Authentication — Anonymous Access Only

The default ntfy setup has no concept of users, roles, or scoped permissions:

**Security gaps:**
- No way to restrict publishing rights to specific users
- Cannot implement read-only or write-only access patterns
- No token-based authentication for API access
- Impossible to trace messages back to specific users or systems
- No protection against credential compromise (because there are no credentials)

### 4. 🎯 Topic Name Vulnerability — Predictable Namespace

Topics are simple strings with no built-in security mechanisms:

**Attack vectors:**
- Dictionary attacks against common topic names ("alerts", "notifications", "backup")
- Brute force enumeration of short topic names
- Social engineering to discover topic naming patterns
- Accidental collisions with other users' topics

**Example vulnerable patterns:**

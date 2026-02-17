# Reference: twx-cli Architecture (for nai-cli structure reference)

## Project Structure
```
twx-cli/
├── src/
│   ├── cli.ts              # Entry point, command definitions (commander)
│   ├── config.ts            # Credential loading & validation
│   └── client/
│       ├── index.ts         # XClient base — OAuth, fetch, rate limiting
│       ├── types.ts         # Shared type definitions
│       ├── posts.ts         # Post CRUD, timeline, search
│       ├── users.ts         # User lookup, follow/unfollow
│       └── engagement.ts    # Like, unlike, retweet
├── docs/
├── package.json
├── tsconfig.json
└── README.md
```

## Design Decisions
- **Functional module pattern**: Domain functions take client as first parameter
- **Domain separation**: Each module handles one concern
- **Native fetch**: No HTTP library dependency (Node >= 18)
- **config.json in ~/.config/**: XDG-compliant
- **commander** for CLI, **chalk** for output

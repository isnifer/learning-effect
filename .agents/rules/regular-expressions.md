# Use regular expressions only as a last resort

Before adding a regular expression, look for an existing platform or standard-library API that
provides the required behavior. If none exists, look for a well-maintained library whose documented
semantics match the requirement.

Add a regular expression only when neither option solves the problem without introducing a worse
tradeoff. Do not replace a suitable library with a custom regular expression to avoid a dependency
without a concrete reason.

For every non-trivial regular expression that remains in the codebase:

- give it a descriptive name instead of leaving it inline;
- link to the specification, authoritative implementation, or documentation from which its
  semantics were derived;
- document intentional differences from the referenced behavior;
- add direct colocated tests for accepted, rejected, and relevant boundary inputs.

When no external specification exists because the pattern represents a project-specific domain
rule, document that domain rule next to the expression and cover it with direct tests.

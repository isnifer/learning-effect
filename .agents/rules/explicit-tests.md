# Write tests explicitly

Keep every test case visible in the colocated test file for the subject under test.

Do not extract `describe`, `layer`, `it`, or `it.effect` registration into shared functions, test
factories, contract helpers, or generic test-suite abstractions.

When multiple implementations must demonstrate the same behavior, write the behavior explicitly in
each implementation's test file. Prefer readable duplication over an abstraction that hides which
tests belong to a subject.

Shared setup may provide inert fixtures or infrastructure. It must not register tests or conceal the
test suite's structure.

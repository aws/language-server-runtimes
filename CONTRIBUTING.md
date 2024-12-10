# Contributing Guidelines

Thank you for your interest in contributing to our project. Whether it's a bug report, new feature, correction, or additional
documentation, we greatly value feedback and contributions from our community.

Please read through this document before submitting any issues or pull requests to ensure we have all the necessary
information to effectively respond to your bug report or contribution.


## Reporting Bugs/Feature Requests

We welcome you to use the GitHub issue tracker to report bugs or suggest features.

When filing an issue, please check existing open, or recently closed, issues to make sure somebody else hasn't already
reported the issue. Please try to include as much information as you can. Details like these are incredibly useful:

* A reproducible test case or series of steps
* The version of our code being used
* Any modifications you've made relevant to the bug
* Anything unusual about your environment or deployment


## Commit Message Guidelines

Commit messages merged to main branch must follow [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) specification format. This is required to ensure readable, standard format of commits history. We also rely on it to setup automation for generating change logs and making releases.

### Commit message format

The commit message should be structured as follows:

```
<type>([optional scope]): <description>
[optional body]
[optional footer(s)]
```

The header is mandatory and the scope of the header is optional. Examples:

```
docs: correct spelling of CHANGELOG
```

```
feat(runtimes): allow provided config object to extend other configs
BREAKING CHANGE: `extends` key in config file is now used for extending other config files
```

See more examples at https://www.conventionalcommits.org/en/v1.0.0/#examples.

### Types

Type can have one of the following values:

* **build**: changes to the build system
* **chore**: any housekeeping changes, which don't fall in other category
* **ci**: changes to CI script and workflows
* **docs**: changes to documentation
* **feat**: a new feature
* **fix**: a bug fix
* **style**: visual-only changes, not impacting functionality
* **refactor**: refactorings not impacting functionality, which are not features or bug fixes
* **perf**: changes that improve performance of code
* **test**: adding or fixing tests

### Scope

The scope should indicate a package, affected by the change. List of support scopes, and corresponding packages:

* **chat-client-ui-types**: `./chat-client-ui-types`
* **runtimes**: `./runtimes`
* **types**: `./types`

Empty scopes are allowed, and can be used for cases when change is not related to any particular package, e.g. for `ci:` or `docs:`

### Footer

One or more footers may be provided one blank line after the body.

**Breaking Change** must start with `BREAKING CHANGE:` words, following with description of the breaking change.

### Usage of Conventional Commit Types

The commit contains the following structural elements, to communicate intent to the consumers of your library:

* **fix**: a commit of the type fix patches a bug in your codebase (this correlates with PATCH in Semantic Versioning).
* **feat**: a commit of the type feat introduces a new feature to the codebase (this correlates with MINOR in Semantic Versioning).
* **BREAKING CHANGE**: a commit that has a footer `BREAKING CHANGE:`, or appends a `!` after the type/scope, introduces a breaking API change (correlating with MAJOR in Semantic Versioning). A BREAKING CHANGE can be part of commits of any *type*.

These rules are used by our automation workflows to collect change logs, and to compute next Semantic Version of packages, impacted by commit.

Since this repository is a shared shared monorepo with many packages, be careful when introducing changes impacting several packages. Extra care should be given when using version-impacting types (especially BREAKING CHANGE).


## Contributing via Pull Requests
Contributions via pull requests are much appreciated. Before sending us a pull request, please ensure that:

1. You are working against the latest source on the *main* branch.
2. You check existing open, and recently merged, pull requests to make sure someone else hasn't addressed the problem already.
3. You open an issue to discuss any significant work - we would hate for your time to be wasted.

To send us a pull request, please:

1. Fork the repository.
2. Modify the source; please focus on the specific change you are contributing. If you also reformat all the code, it will be hard for us to focus on your change.
3. Ensure local tests pass.
4. Commit to your fork using clear commit messages.
5. Send us a pull request, answering any default questions in the pull request interface.
6. Pay attention to any automated CI failures reported in the pull request, and stay involved in the conversation.

GitHub provides additional document on [forking a repository](https://help.github.com/articles/fork-a-repo/) and
[creating a pull request](https://help.github.com/articles/creating-a-pull-request/).


## Finding contributions to work on
Looking at the existing issues is a great way to find something to contribute on. As our projects, by default, use the default GitHub issue labels (enhancement/bug/duplicate/help wanted/invalid/question/wontfix), looking at any 'help wanted' issues is a great place to start.


## Code of Conduct
This project has adopted the [Amazon Open Source Code of Conduct](https://aws.github.io/code-of-conduct).
For more information see the [Code of Conduct FAQ](https://aws.github.io/code-of-conduct-faq) or contact
opensource-codeofconduct@amazon.com with any additional questions or comments.


## Licensing

See the [LICENSE](LICENSE) file for our project's licensing. We will ask you to confirm the licensing of your contribution.

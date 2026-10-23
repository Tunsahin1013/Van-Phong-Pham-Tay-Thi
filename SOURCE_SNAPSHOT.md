# Source snapshot provenance

The clean rebuild was based on the cached Git metadata bundled with the previously uploaded source archive. Its cached `origin/main` reference resolved to:

- Commit: `785a10b3379bbf4cd1537e975d0193744a5fc062`
- Subject: `Merge pull request #10 from Tunsahin1013/feature/12-them-project`

The runtime used to prepare this package could not resolve `github.com` for a fresh network clone. Therefore this is a reconstruction from the cached repository snapshot, not a claim that it was fetched live from GitHub at delivery time. Clone the current repository on your Windows machine first, then apply this source with `APPLY_CLEAN_REBUILD.ps1`; review `git diff` before committing in case GitHub's `main` has newer commits.

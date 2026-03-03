"""
Security checks for Helm chart YAML files.
Checks for dangerous security misconfigurations.
"""

def check_run_as_root(containers: list) -> list:
    """Check if any container runs as root (UID 0)."""
    issues = []
    for container in containers:
        security_ctx = container.get("securityContext", {})
        run_as_user = security_ctx.get("runAsUser", 0)  # default is root if not set
        if run_as_user == 0:
            issues.append({
                "severity": "HIGH",
                "rule": "RUN_AS_ROOT",
                "message": f"Container '{container.get('name', 'unknown')}' runs as root (UID 0)",
                "fix": "Set securityContext.runAsUser to a non-zero value like 1000"
            })
    return issues


def check_privileged(containers: list) -> list:
    """Check if any container runs in privileged mode."""
    issues = []
    for container in containers:
        security_ctx = container.get("securityContext", {})
        if security_ctx.get("privileged", False):
            issues.append({
                "severity": "HIGH",
                "rule": "PRIVILEGED_CONTAINER",
                "message": f"Container '{container.get('name', 'unknown')}' is running in privileged mode",
                "fix": "Remove securityContext.privileged: true unless absolutely necessary"
            })
    return issues


def check_host_network(spec: dict) -> list:
    """Check if pod uses host network namespace."""
    issues = []
    if spec.get("hostNetwork", False):
        issues.append({
            "severity": "HIGH",
            "rule": "HOST_NETWORK",
            "message": "Pod uses host network namespace (hostNetwork: true)",
            "fix": "Remove hostNetwork: true unless required for network tools"
        })
    return issues
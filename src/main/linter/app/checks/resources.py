def check_resource_limits(containers: list) -> list:
    issues = []
    for container in containers:
        resources = container.get("resources", {})
        name = container.get("name", "unknown")
        if not resources.get("limits"):
            issues.append({
                "severity": "MEDIUM",
                "rule": "NO_RESOURCE_LIMITS",
                "message": f"Container '{name}' has no CPU/memory limits",
                "fix": "Add resources.limits.cpu and resources.limits.memory"
            })
        if not resources.get("requests"):
            issues.append({
                "severity": "LOW",
                "rule": "NO_RESOURCE_REQUESTS",
                "message": f"Container '{name}' has no resource requests defined",
                "fix": "Add resources.requests.cpu and resources.requests.memory"
            })
    return issues
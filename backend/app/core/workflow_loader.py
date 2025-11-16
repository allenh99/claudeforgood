from pathlib import Path
from types import ModuleType
from typing import Optional
import importlib.util
import sys


def load_workflow_module() -> Optional[ModuleType]:
	"""
	Dynamically load the backend/workflow.py module by absolute path
	so it works regardless of PYTHONPATH or working directory.
	"""
	backend_dir = Path(__file__).parent.parent.parent
	workflow_path = backend_dir / "workflow.py"
	if not workflow_path.exists():
		return None

	spec = importlib.util.spec_from_file_location("workflow", str(workflow_path))
	if spec is None or spec.loader is None:
		return None
	module = importlib.util.module_from_spec(spec)
	sys.modules["workflow"] = module
	spec.loader.exec_module(module)
	return module


#  Copyright 2021 Collate
#  Licensed under the Apache License, Version 2.0 (the "License");
#  you may not use this file except in compliance with the License.
#  You may obtain a copy of the License at
#  http://www.apache.org/licenses/LICENSE-2.0
#  Unless required by applicable law or agreed to in writing, software
#  distributed under the License is distributed on an "AS IS" BASIS,
#  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
#  See the License for the specific language governing permissions and
#  limitations under the License.

"""
Source connection handler
"""
from functools import partial
from typing import Optional

from metadata.generated.schema.entity.automations.workflow import (
    Workflow as AutomationWorkflow,
)
from metadata.generated.schema.entity.services.connections.metadata.amundsenConnection import (
    AmundsenConnection,
)
from metadata.ingestion.connections.test_connections import (
    SourceConnectionException,
    test_connection_steps,
)
from metadata.ingestion.ometa.ometa_api import OpenMetadata
from metadata.ingestion.source.metadata.amundsen.client import Neo4JConfig, Neo4jHelper
from metadata.ingestion.source.metadata.amundsen.queries import (
    NEO4J_AMUNDSEN_USER_QUERY,
)


def get_connection(connection: AmundsenConnection) -> Neo4jHelper:
    """
    Create connection
    """
    try:
        neo4j_config = Neo4JConfig(
            username=connection.username,
            password=connection.password.get_secret_value(),
            neo4j_url=connection.hostPort,
            max_connection_life_time=connection.maxConnectionLifeTime,
            neo4j_encrypted=connection.encrypted,
            neo4j_validate_ssl=connection.validateSSL,
        )
        return Neo4jHelper(neo4j_config)
    except Exception as exc:
        msg = f"Unknown error connecting with {connection}: {exc}."
        raise SourceConnectionException(msg)


def test_connection(
    metadata: OpenMetadata,
    client: Neo4jHelper,
    service_connection: AmundsenConnection,
    automation_workflow: Optional[AutomationWorkflow] = None,
) -> None:
    """
    Test connection. This can be executed either as part
    of a metadata workflow or during an Automation Workflow
    """

    test_fn = {
        "CheckAccess": partial(client.execute_query, query=NEO4J_AMUNDSEN_USER_QUERY)
    }

    test_connection_steps(
        metadata=metadata,
        test_fn=test_fn,
        service_fqn=service_connection.type.value,
        automation_workflow=automation_workflow,
    )

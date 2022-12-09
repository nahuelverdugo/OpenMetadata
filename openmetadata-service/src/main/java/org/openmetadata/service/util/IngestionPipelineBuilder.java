/*
 *  Copyright 2021 Collate
 *  Licensed under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *  http://www.apache.org/licenses/LICENSE-2.0
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 */

package org.openmetadata.service.util;

import static org.openmetadata.schema.entity.services.ingestionPipelines.PipelineType.METADATA;

import java.util.List;
import org.jetbrains.annotations.Nullable;
import org.openmetadata.schema.entity.services.ingestionPipelines.IngestionPipeline;
import org.openmetadata.schema.metadataIngestion.DatabaseServiceMetadataPipeline;
import org.openmetadata.schema.security.client.Auth0SSOClientConfig;
import org.openmetadata.schema.security.client.AzureSSOClientConfig;
import org.openmetadata.schema.security.client.CustomOIDCSSOClientConfig;
import org.openmetadata.schema.security.client.GoogleSSOClientConfig;
import org.openmetadata.schema.security.client.OktaSSOClientConfig;
import org.openmetadata.schema.security.client.OpenMetadataJWTClientConfig;
import org.openmetadata.service.Entity;

public class IngestionPipelineBuilder {

  private static final List<Class<?>> SECURITY_CONFIG_CLASSES =
      List.of(
          OpenMetadataJWTClientConfig.class,
          GoogleSSOClientConfig.class,
          OktaSSOClientConfig.class,
          Auth0SSOClientConfig.class,
          AzureSSOClientConfig.class,
          CustomOIDCSSOClientConfig.class);

  /**
   * Build `IngestionPipeline` object with concrete class for the config which by definition it is a `Object`.
   *
   * @param ingestionPipeline the ingestion pipeline object
   * @return ingestion pipeline with concrete classes
   */
  public static IngestionPipeline build(IngestionPipeline ingestionPipeline) {
    if (METADATA.equals(ingestionPipeline.getPipelineType())
        && ingestionPipeline.getService().getType().equals(Entity.DATABASE_SERVICE)
        && ingestionPipeline.getSourceConfig() != null) {
      DatabaseServiceMetadataPipeline databaseServiceMetadataPipeline =
          JsonUtils.convertValue(
              ingestionPipeline.getSourceConfig().getConfig(), DatabaseServiceMetadataPipeline.class);
      ingestionPipeline.getSourceConfig();
    }
    if (ingestionPipeline.getOpenMetadataServerConnection() != null) {
      ingestionPipeline
          .getOpenMetadataServerConnection()
          .setSecurityConfig(
              buildSecurityConfig(ingestionPipeline.getOpenMetadataServerConnection().getSecurityConfig()));
    }
    return ingestionPipeline;
  }

  private static Object buildSecurityConfig(Object config) {
    return buildBasedOnClassList(config, SECURITY_CONFIG_CLASSES);
  }

  @Nullable
  private static Object buildBasedOnClassList(Object config, List<Class<?>> listOfClasses) {
    if (config != null) {
      for (Class<?> clazz : listOfClasses) {
        try {
          return JsonUtils.convertValue(config, clazz);
        } catch (Exception ignored) {
        }
      }
      throw new IllegalArgumentException("Impossible to parse the object of the Ingestion Pipeline.");
    }
    return null;
  }
}

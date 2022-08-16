package org.openmetadata.catalog.security.policyevaluator;

import static org.openmetadata.common.utils.CommonUtil.listOrEmpty;

import java.io.IOException;
import java.util.List;
import java.util.UUID;
import lombok.Builder;
import lombok.Getter;
import lombok.NonNull;
import org.openmetadata.catalog.Entity;
import org.openmetadata.catalog.EntityInterface;
import org.openmetadata.catalog.jdbi3.EntityRepository;
import org.openmetadata.catalog.type.EntityReference;
import org.openmetadata.catalog.type.TagLabel;
import org.openmetadata.catalog.util.EntityUtil;

/**
 * Builds ResourceContext lazily. ResourceContext includes all the attributes of a resource a user is trying to access
 * to be used for evaluating Access Control policies.
 *
 * <p>As multiple threads don't access this, the class is not thread-safe by design.
 */
@Builder
public class ResourceContext implements ResourceContextInterface {
  @NonNull @Getter private String resource;
  @NonNull private EntityRepository<? extends EntityInterface> entityRepository;
  private UUID id;
  private String name;
  private EntityInterface entity; // Will be lazily initialized

  @Override
  public EntityReference getOwner() throws IOException {
    resolveEntity();
    return entity == null ? null : entity.getOwner();
  }

  @Override
  public List<TagLabel> getTags() throws IOException {
    resolveEntity();
    return entity == null ? null : listOrEmpty(entity.getTags());
  }

  @Override
  public EntityInterface getEntity() throws IOException {
    return resolveEntity();
  }

  private EntityInterface resolveEntity() throws IOException {
    if (entity == null) {
      String fields = "";
      if (entityRepository.isSupportsOwner()) {
        fields = EntityUtil.addField(fields, Entity.FIELD_OWNER);
      }
      if (entityRepository.isSupportsTags()) {
        fields = EntityUtil.addField(fields, Entity.FIELD_TAGS);
      }
      if (id != null) {
        entity = entityRepository.get(null, id, entityRepository.getFields(fields));
      } else if (name != null) {
        entity = entityRepository.getByName(null, name, entityRepository.getFields(fields));
      }
    }
    return entity;
  }
}

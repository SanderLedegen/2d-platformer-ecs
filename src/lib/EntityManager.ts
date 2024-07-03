import { Entity } from './Entity';

export class EntityManager {
  private numEntities = 0;
  private entityMap: Map<string, Entity[]> = new Map();
  private entitiesToAdd: Entity[] = [];

  public update(): void {
    for (const entity of this.entitiesToAdd) {
      const tag = entity.getTag();

      if (!this.entityMap.has(tag)) {
        this.entityMap.set(tag, []);
      }

      this.entityMap.get(tag)!.push(entity);
    }

    this.entitiesToAdd = [];

    this.removeDestroyedEntities();
  }

  public addEntity(tag: string): Entity {
    const entity = new Entity(this.numEntities++, tag);

    this.entitiesToAdd.push(entity);

    return entity;
  }

  public getEntitiesByTag(tag: string): Entity[] {
    return this.entityMap.get(tag) || [];
  }

  public getAllEntities(): Entity[] {
    const entities = Array.from(this.entityMap.values());
    return entities.flat();
  }

  public removeDestroyedEntities(): void {
    for (const [tag, entities] of this.entityMap.entries()) {
      const undestroyedEntities = entities.filter((e) => e.isActive());
      this.entityMap.set(tag, undestroyedEntities);
    }
  }
}

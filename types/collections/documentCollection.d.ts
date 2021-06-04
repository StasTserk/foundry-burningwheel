/**
 * An iterable container of Entity objects within the Foundry Virtual Tabletop framework.
 * Each Entity type has it's own subclass of DocumentCollection, which defines the abstract interface.
 * @typeParam T - The type of Entities in the DocumentCollection
 */
 declare abstract class DocumentCollection<T extends FoundryDocument = FoundryDocument> extends Collection<T> {
    /**
     * @param data - An Array of Entity data from which to create instances
     */
    constructor(data: T['_data'][]);
  
    /**
     * An Array of application references which will be automatically updated when
     * the collection content changes
     */
    apps: Application[];
  
    /**
     * Return an Array of all the entry values in the Collection
     */
     contents: Array<T>;
     
    /**
     * A reference to the Document class definition which is contained within this DocumentCollection.
     */
     documentClass: ConstructorOf<T>;
     
     /**
      * A reference to the named Document class which is contained within this DocumentCollection.
      */
     documentName: string;
  
    /**
     * Render any Applications associated with this DocumentCollection
     * @param args -
     * @returns A reference to the rendered DocumentCollection
     * @see {@link Application.render}
     */
    render(...args: Parameters<Application['render']>): this;
  
    /**
     * The DocumentCollection name
     */
    get name(): string;
  
    /**
     * Return a reference to the SidebarDirectory application for this
     * DocumentCollection, or null if it has not yet been created.
     */
    get directory(): SidebarDirectory | null;
  
    /**
     * Return a reference to the base Entity name which is contained within this
     * DocumentCollection.
     */
    abstract get entity(): string;
  
    /**
     * Return a reference to the singleton instance of this DocumentCollection, or
     * null if it has not yet been created.
     */
    static get instance(): DocumentCollection<FoundryDocument> | null;
  
    /**
     * Return a reference to the Entity subclass which should be used when
     * creating elements of this DocumentCollection.
     * This should always be an explicit reference to the class which is used in
     * this game to represent the entity, and not the base implementation of that
     * entity type.
     */
    get object(): ConstructorOf<T>;
  
    /**
     * Add a new Entity to the DocumentCollection, asserting that they are of the
     * correct type.
     * @param entity - The entity instance to add to the collection
     * @deprecated
     */
    insert(entity: T): void;
  
    /**
     * Remove an Entity from the DocumentCollection by its ID.
     * @param id - The entity ID which should be removed
     * @deprecated
     */
    remove(id: string): void;
  
    /**
     * Import an Entity from a compendium collection, adding it to the current
     * World.
     * @param collection - The name of the pack from which to import
     * @param entryId    - The ID of the compendium entry to import
     * @param updateData - Optional additional data used to modify the imported
     *                     Entity before it is created
     *                     (default: `{}`)
     * @param options    - Optional arguments passed to the Entity.create method
     *                     (default: `{}`)
     * @returns A Promise containing the imported Entity
     * @deprecated
     */
    importFromCollection(
      collection: string,
      entryId: string,
      updateData?: DeepPartial<T['_data']>,
      options?: Entity.CreateOptions
    ): Promise<T>;
  
    /**
     * Apply data transformations when importing an Entity from a Compendium pack
     * @param data - The original Compendium entry data
     * @returns The processed data ready for Entity creation
     * @deprecated
     */
    fromCompendium(data: DeepPartial<T['_data']>): DeepPartial<T['_data']>;
  
    /**
     * Update all objects in this DocumentCollection with a provided transformation.
     * Conditionally filter to only apply to Entities which match a certain
     * condition.
     * @param transformation - An object of data or function to apply to all
     *                         matched objects
     * @param condition      - A function which tests whether to target each object
     *                         (default: `null`)
     * @param options        - Additional options passed to Entity.update
     * @returns An array of updated data once the operation is complete
     */
    updateAll(
      transformation: DeepPartial<T['_data']> | ((obj: T) => DeepPartial<T['_data']>),
      condition?: (obj: T) => boolean,
      options?: Entity.UpdateOptions
     ): Promise<T[]>;
     
     _onUpdateDocuments(documents, result, options, userId)
  }
  
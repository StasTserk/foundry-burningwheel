/**
 * The Actor Document which represents the protagonists, characters, enemies, and more that inhabit and take actions
 * within the World.
 *
 * @typeParam D  - The type the `Actor`'s `_data` field. It should extend Actor.Data
 * @typeParam I  - The type of the `Item` class used by the system. Its `_data` field should match item data type of `D`.
 * @typeParam PD - The type of the `Actor`'s `data` field after `prepareData` has been called. It should extend `D`.
 *
 * @see {@link Actors} Each Actor belongs to the Actors collection.
 * @see {@link ActorSheet} Each Actor is edited using the ActorSheet application or a subclass thereof.
 * @see {@link ActorDirectory} All Actors which exist in the world are rendered within the ActorDirectory sidebar tab.
 *
 *
 * @example <caption>Create a new Actor</caption>
 * ```typescript
 * let actor = await Actor.create({
 *   name: "New Test Actor",
 *   type: "character",
 *   img: "artwork/character-profile.jpg",
 *   folder: folder.data._id,
 *   sort: 12000,
 *   data: {},
 *   token: {},
 *   items: [],
 *   flags: {}
 * });
 * ```
 *
 * @example <caption>Retrieve an existing Actor</caption>
 * ```typescript
 * if (!game.actors) throw new Error("Too early to use an entity collection");
 * let actor = game.actors.get(actorId);
 * ```
 */
 declare class Actor<
 D extends Actor.Data = Actor.Data,
 I extends Item<any> = Item<Item.Data>,
 PD extends D = D
> extends FoundryDocument<D, PD> {
 constructor(data?: DeepPartial<D>, options?: FoundryDocument.CreateOptions);

 /**
  * A reference to a placed Token which creates a synthetic Actor
  */
 token: Token | null;

 /**
  * Construct the Array of Item instances for the Actor
  * Items are prepared by the Actor.prepareEmbeddedEntities() method
  */
 items: Collection<I>;

 /**
  * ActiveEffects are prepared by the Actor.prepareEmbeddedEntities() method
  */
 effects: Collection<ActiveEffect<this>>;

 /**
  * A set that tracks which keys in the data model were modified by active effects
  */
 overrides: DeepPartial<D>;

 /**
  * Cache an Array of allowed Token images if using a wildcard path
  */
 protected _tokenImages: string[];

 /** @override */
 static get config(): FoundryDocument.Config<Actor>;

 /* -------------------------------------------- */
 /*  Properties                                  */
 /* -------------------------------------------- */

 /**
  * A convenient reference to the file path of the Actor's profile image
  */
 get img(): string;

 /**
  * Classify Owned Items by their type
  */
 get itemTypes(): {
   [itemType: string]: I[];
 };

 /**
  * Test whether an Actor entity is a synthetic representation of a Token (if true) or a full Document (if false)
  */
 get isToken(): boolean;

 /**
  * An array of ActiveEffect instances which are present on the Actor which have a limited duration.
  * @returns
  */
 get temporaryEffects(): ActiveEffect<this>[];

 /* -------------------------------------------- */
 /*  Data Preparation                            */
 /* -------------------------------------------- */

 /**
  * @remarks
  * Returns void
  * @override
  */
 prepareData(): void;

 /**
  * First prepare any derived data which is actor-specific and does not depend on Items or Active Effects
  */
 prepareBaseData(): void;

 /**
  * Apply final transformations to the Actor data after all effects have been applied
  */
 prepareDerivedData(): void;

 /** @override */
 prepareEmbeddedEntities(): void;

 /**
  * Prepare a Collection of OwnedItem instances which belong to this Actor.
  * @param items - The raw array of item objects
  * @returns The prepared owned items collection
  */
 protected _prepareOwnedItems(items: Array<Actor.OwnedItemData<D>>): Collection<I>;

 /**
  * Prepare a Collection of ActiveEffect instances which belong to this Actor.
  * @param effects - The raw array of active effect objects
  * @returns The prepared active effects collection
  */
 protected _prepareActiveEffects(effects: ActiveEffect.Data[]): Collection<ActiveEffect<this>>;

 /**
  * Apply any transformations to the Actor data which are caused by ActiveEffects.
  */
 applyActiveEffects(): void;

 /* -------------------------------------------- */
 /*  Methods                                     */
 /* -------------------------------------------- */

 /**
  * Create a synthetic Actor using a provided Token instance
  * If the Token data is linked, return the true Actor entity
  * If the Token data is not linked, create a synthetic Actor using the Token's actorData override
  */
 static fromToken(token: Token): Actor;

 /**
  * Create a synthetic Token Actor instance which is used in place of an actual Actor.
  * Cache the result in Actors.tokens.
  * @param baseActor - The real actor to clone
  * @param token     - The Token containing the actor
  */
 static createTokenActor(baseActor: Actor, token: Token): Actor;

 /**
  * Retrieve an Array of active tokens which represent this Actor in the current canvas Scene.
  * If the canvas is not currently active, or there are no linked actors, the returned Array will be empty.
  *
  * @param linked - Only return tokens which are linked to the Actor. Default (false) is to return all
  *                 tokens even those which are not linked.
  * @returns An array of tokens in the current Scene which reference this Actor.
  */
 getActiveTokens(linked?: boolean): Token[];

 /**
  * Prepare a data object which defines the data schema used by dice roll commands against this Actor
  * @returns A copy of data.data
  * @remarks Testing actor.data.type does not narrow the type for this method
  */
 getRollData(): Duplicated<PD['data']>;

 /**
  * Get an Array of Token images which could represent this Actor
  */
 getTokenImages(): Promise<string[]>;

 /**
  * Handle how changes to a Token attribute bar are applied to the Actor.
  * This allows for game systems to override this behavior and deploy special logic.
  * @param attribute - The attribute path
  * @param value     - The target attribute value
  * @param isDelta   - Whether the number represents a relative change (true) or an absolute change (false)
  * @param isBar     - Whether the new value is part of an attribute bar, or just a direct value
  * @returns The updated Actor entity
  */
 modifyTokenAttribute(attribute: string, value: number, isDelta?: boolean, isBar?: boolean): Promise<this>;

 /**
  * Roll initiative for all Combatants in the currently active Combat encounter which are associated with this Actor.
  * If viewing a full Actor entity, all Tokens which map to that actor will be targeted for initiative rolls.
  * If viewing a synthetic Token actor, only that particular Token will be targeted for an initiative roll.
  *
  * @param createCombatants  - Create new Combatant entries for Tokens associated with this actor.
  * @param rerollInitiative  - Re-roll the initiative for this Actor if it has already been rolled.
  * @param initiativeOptions - Additional options passed to the Combat#rollInitiative method.
  * @returns A promise which resolves to the Combat entity once rolls are complete.
  */
 rollInitiative({
   createCombatants,
   rerollInitiative,
   initiativeOptions
 }?: {
   createCombatants?: boolean;
   rerollInitiative?: boolean;
   initiativeOptions?: any;
 }): Promise<Combat | null>;

 /* -------------------------------------------- */
 /*  Socket Listeners and Handlers
 /* -------------------------------------------- */

 /** @override */
 update<U>(data: Expanded<U> extends DeepPartial<D> ? U : never, options?: FoundryDocument.UpdateOptions): Promise<this>;
 update(data: DeepPartial<D>, options?: FoundryDocument.UpdateOptions): Promise<this>;

 /** @override */
 delete(options?: FoundryDocument.DeleteOptions): Promise<this>;

 /** @override */
 protected _onUpdate(data: DeepPartial<D>, options: FoundryDocument.UpdateOptions, userId: string, context?: any): void;

 /**
  * When Owned Items are created process each item and extract Active Effects to transfer to the Actor.
  * @param created - Created owned Item data objects
  * @param temporary - Is this a temporary item creation?
  * @returns An array of effects to transfer to the Actor
  */
 protected _createItemActiveEffects(
   created: Actor.OwnedItemData<D> | Array<Actor.OwnedItemData<D>>,
   { temporary }?: { temporary?: boolean }
 ): Promise<ActiveEffect.Data[] | ActiveEffect.Data | undefined>;

 /** @override */
 protected _onCreateEmbeddedEntity(
   embeddedName: string,
   child: Actor.OwnedItemData<D> | ActiveEffect.Data,
   options: any,
   userId: string
 ): void;

 /** @override */
 deleteEmbeddedEntity(embeddedName: 'OwnedItem', data: string, options?: any): Promise<Actor.OwnedItemData<D>>;

 /** @override */
 deleteEmbeddedEntity(embeddedName: 'ActiveEffect', data: string, options?: any): Promise<ActiveEffect.Data>;

 /**
  * When Owned Items are created process each item and extract Active Effects to transfer to the Actor.
  * @param deleted - The array of deleted owned Item data
  */
 protected _deleteItemActiveEffects(
   deleted: Actor.OwnedItemData<D> | Array<Actor.OwnedItemData<D>>
 ): Promise<ActiveEffect.Data | ActiveEffect.Data[] | undefined>;

 /** @override */
 protected _onDeleteEmbeddedEntity(
   embeddedName: string,
   child: Actor.OwnedItemData<D> | ActiveEffect.Data,
   options: any,
   userId: string
 ): void;

 /** @override */
 protected _onModifyEmbeddedEntity(
   embeddedName: string,
   changes: Array<Actor.OwnedItemData<D>> | ActiveEffect.Data[],
   options: any,
   userId: string,
   context?: any
 ): void;

 /* -------------------------------------------- */
 /*  Owned Item Management                       */
 /* -------------------------------------------- */

 /**
  * Get an Item instance corresponding to the Owned Item with a given id
  * @param itemId - The owned Item id to retrieve
  * @returns An Item instance representing the Owned Item within the Actor entity
  * @deprecated use Actor#items#get
  */
 getOwnedItem(itemId: string): I;

 /**
  * Create a new item owned by this Actor. This redirects its arguments to the createEmbeddedEntity method.
  * @see Document#createEmbeddedEntity
  *
  * @param itemData    - Data for the newly owned item
  * @param options     - Item creation options
  * @param renderSheet - Render the Item sheet for the newly created item data
  * @returns A Promise resolving to the created Owned Item data
  * @deprecated use Actor#createEmbeddedDocuments or Item.create
  */
 createOwnedItem(itemData: DeepPartial<Actor.OwnedItemData<D>>, options?: any): Promise<Actor.OwnedItemData<D>>;
 createOwnedItem(itemData: DeepPartial<Item.Data>[], options?: any): Promise<Item.Data[]>;

 /**
  * Update an owned item using provided new data. This redirects its arguments to the updateEmbeddedEntity method.
  * @see Document#updateEmbeddedEntity
  *
  * @param itemData - Data for the item to update
  * @param options  - Item update options
  * @returns A Promise resolving to the updated Owned Item data
  */
 updateOwnedItem(
   itemData: DeepPartial<Actor.OwnedItemData<D>>,
   options?: FoundryDocument.UpdateOptions
 ): Promise<Actor.OwnedItemData<D>>;
 updateOwnedItem(
   itemData: DeepPartial<Actor.OwnedItemData<D>>[],
   options?: FoundryDocument.UpdateOptions
 ): Promise<Array<Actor.OwnedItemData<D>>>;

 /* -------------------------------------------- */

 /**
  * Delete an owned item by its id. This redirects its arguments to the deleteEmbeddedEntity method.
  * @see FoundryDocument#deleteEmbeddedEntity
  *
  * @param itemId - The ID of the item to delete
  * @param options - Item deletion options
  * @returns A Promise resolving to the deleted Owned Item data
  * @deprecated use Item.delete or Actor#deleteEmbeddedDocuments
  */
  deleteOwnedItem(itemId: string, options?: FoundryDocument.DeleteOptions): Promise<Actor.OwnedItemData<D>>;
  deleteOwnedItem(itemId: string[], options?: FoundryDocument.DeleteOptions): Promise<Array<Actor.OwnedItemData<D>>>;

   
  /**
   * Delete multiple embedded Document instances within a parent Document using provided string ids.
   * @param embeddedName The name of the embedded Document type
   * @param ids An array of string ids for each Document to be deleted
   * @optional context Additional context which customizes the deletion workflow
   * @returns An array of deleted document instances
   */
  deleteEmbeddedDocuments(embeddedName: FoundryDocument.Types, ids: string[], context?: FoundryDocument.ModificationContext): Promise<FoundryDocument[]>
  
  /**
   * Create multiple embedded Document instances within a parent Document using provided string ids.
   * @param embeddedName The name of the embedded Document type
   * @param ids An array of string ids for each Document to be deleted
   * @optional context Additional context which customizes the deletion workflow
   * @returns An array of deleted document instances
   */
  createEmbeddedDocuments<T>(embeddedName: FoundryDocument.Types, data: Partial<FoundryDocument.Data<T>>[], context?: FoundryDocument.ModificationContext): Promise<FoundryDocument[]>

   
 /* -------------------------------------------- */
 /*  DEPRECATED                                  */
 /* -------------------------------------------- */

 /**
  * @deprecated since 0.7.0
  */
 importItemFromCollection(collection: string, entryId: string): Promise<any>;

 /**
  * @deprecated since 0.7.2
  * @see {@link Document#hasPlayerOwner}
  */
 get isPC(): boolean;
}

declare namespace Actor {
 /**
  * @typeParam D - Type for `_data.data`
  * @typeParam I - Type for system's Item's _data
  */
 interface Data<D = any, I extends Item = Item> extends FoundryDocument.Data {
   data: D;
   effects: ActiveEffect.Data[];
   folder: string;
   img: string;
   items: DocumentCollection<I>;
   name: string;
   permission: FoundryDocument.Permission;
   sort: number;
   readonly token: Token
   type: string;
 }

 /**
  * Full item type for owned items
  * @typeParam D - Actor.Data to extract Item type from
  * @internal
  */
 type OwnedItemData<D extends Data> = D['items'][number];
}
